import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import openai

app = Flask(__name__)
CORS(app)

ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    print("🔍 Received request at /upload")  # ✅ Debugging log

    # Check if the request contains files
    if "file-input" not in request.files:
        print("❌ No file found in request.files!")  # ✅ Debugging log
        return jsonify({"error": "No file part"}), 400

    file = request.files["file-input"]

    if file.filename == "":
        print("❌ No file selected!")  # ✅ Debugging log
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        print(f"❌ Invalid file type: {file.filename}")  # ✅ Debugging log
        return jsonify({"error": "Invalid file type. Only CSVs are allowed."}), 400

    print(f"✅ File '{file.filename}' uploaded successfully!")  # ✅ Debugging log
    return jsonify({"message": f"File '{file.filename}' uploaded successfully!"})

# @app.route('/analyze', methods=['POST'])


if __name__ == "__main__":
    app.run(debug=True)

