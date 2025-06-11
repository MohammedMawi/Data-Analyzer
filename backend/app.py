import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import openai

app = Flask(__name__)
CORS(app) # Allows cross-origin requests, which is useful for development purposes. Allows frontend (React) to communicate with backend (Flask) even if they are running on different ports or domains.

ALLOWED_EXTENSIONS = {'csv'}
dataframe_store = {} 

# Funtion to check if the file uploaded is a CSV
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['POST'])
def upload_file():
    print("🔍 Received request at /")  # ✅ Debugging log

    # If the input field in Upload.js is missing/renamed/has wrong name, this will return an error message instead of crashing 
    if "file-input" not in request.files:
        print("❌ No file found in request.files!")  # ✅ Debugging log
        return jsonify({"error": "No file part"}), 400

    file = request.files["file-input"] # Retreive the file from the form and store it in the variable "file"

    # If the user clicked the file input but didn't pick a file, then submitted the form. 
    if file.filename == "":
        print("❌ No file selected!")  # ✅ Debugging log
        return jsonify({"error": "No selected file"}), 400

    # If the file is not a CSV, return an error message
    if not allowed_file(file.filename):
        print(f"❌ Invalid file type: {file.filename}")  # ✅ Debugging log
        return jsonify({"error": "Invalid file type. Only CSVs are allowed."}), 400
    
    # If the file is a CSV, save it to the server
    try:
        df = pd.read_csv(file) # ✅ Read CSV directly from memory
        dataframe_store["latest"] = df # Optional: save for later use
        print(f"✅ File '{file.filename}' uploaded successfully!")  # ✅ Debugging log
        return jsonify({"message": f"File '{file.filename}' uploaded successfully!"})
    except Exception as e: # Capture error in variable "e"
        print("❌ Error reading CSV:", str(e)) # str(e) converts the error to a string
        return jsonify({"error": "Failed to process CSV."}), 500 # 500 is a server error code, 400 is a client error code. So if the server fails to process the CSV, it is a server error. If the client fails to send a valid CSV, it is a client error.

@app.route('/data', methods=['GET'])
def get_data():
    print("🔍 Received request at /data")
    print("🔎 Current dataframe:", dataframe_store.get("latest"))

    df = dataframe_store.get("latest")

    if df is None:
        return jsonify({"error": "No data available"}), 404
    
    clean_df = df.replace({np.nan: None}) # pandas uses np.nan to represent missing values. JavaScript doesn't understand NaN in JSON — so this replaces all NaN values with None (which turns into null in JSON). Prevents React from crashing when parsing the response.

    return jsonify({
        "columns": list(clean_df.columns), # Get the column names of the dataframe
        "rows": clean_df.head(100).to_dict(orient="records") # Convert the dataframe to a list of dictionaries, where keys are the column names for a row
    })

if __name__ == "__main__":
    app.run(debug=True)

