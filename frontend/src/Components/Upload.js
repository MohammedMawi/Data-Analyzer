import React from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/upload.css";
import Header from "./Header";


export default function Upload() {

  const [file, setFile] = React.useState(null);
  const [message, setMessage] = React.useState("");
  const navigate = useNavigate(); // react router hook to navigate to different pages

  // What this function does is it take the event object as an argument which is taken from the file input field and then we say files[0] to take the first file selected by the user from the files array and set it to the file state.
  const getFile = (event) => {
    setFile(event.target.files[0]);
  }

  // async function to handle file upload. async is so we can use await, and await is to allow functions to finish executing/loading before javascript starts running the next line of code. In this case we wait for fetch to finish sending the file to the server before we move on to the next line of code.
  const handleFileUpload = async () => {
    // if user clicks upload without selecting any file
    if(file === null) {
      return;
    }

    // Now that we have the file selected by the user in the file state, we can create a new FormData object and append the file
    const formData = new FormData(); // Create a new FormData object
    formData.append("file-input", file); // We append the file to the FormData object in order to send it to the server

    // fetch is how React (frontend) communicates with Flask (backend). Sends request to flask at http://127.0.0.1:5000/.
    // 127.0.0.1 → This is your own computer (localhost).
    //:5000 → This is the port Flask runs on by default.
    // "/"" → This is the Flask route that will handle the file upload.
    // method: "POST" tells fetch() to send a POST request which are used to send data to server
    // body: formData is the actual file we are sending
    try{
      const response = await fetch("http://127.0.0.1:5000/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json(); // We wait for the response from the server and then we convert it to JSON format

      // If the response is ok, we set the message state to the message we get from the json in the server. If the response is not ok, we set the message state to the error message we get from the server.
      if(response.ok){
        setMessage(data.message);
        navigate("/analyze"); // ✅ automatically go to analyze page after successful upload
      }
      else{
        setMessage(data.error);
      }

    } catch (error){
      setMessage("Network error. Could not connect to the server.");
    }
    

  }

  return (
    <>
        <Header />

        <div className="container">
            <h1>Upload Dataset</h1>

            {/* Upload Section */}
            <div className="upload-section">
                <label htmlFor="file-input">
                    <img src="../images/upload_icon.png" alt="Upload" className="upload-image" />
                </label>
                
                <div className="file-upload-row">
                    <input type="file" id="file-input" onChange={getFile} />
                    <button onClick={handleFileUpload}>Upload</button>
                </div>
                
                {file && <h4>Selected File: {file.name}</h4>}
                {message && <h4>{message}</h4>}
            </div>
        </div>
    </>
  );
}