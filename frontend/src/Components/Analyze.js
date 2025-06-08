import React, { useEffect, useState } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../CSS/analyze.css";

export default function Analyze() {

  const [data, setData] = useState(null); // For table data
  const [error, setError] = useState(""); // For any fetch errors

  // useEffect is a React hook that runs a function after the component is rendered. It's second parameter is an empty array, which means it will only run once when the page loads
  useEffect(() => {
    fetch("http://127.0.0.1:5000/data") // Fetch data from the Flask backend at /data 
      .then((res) => { // .then() handles the server's response once fetch finishes 
        if (!res.ok) { // if response is not ok, throw an error
          throw new Error("Server responded with status " + res.status);
        }
        return res.json(); // Otherwise, parse the response as JSON
      })
      .then((result) => { // result is the parsed JSON data from the server. Result of res.json()
        console.log("✅ Result received:", result);
        if (result.error) { //if result contains an error, set the error state
          setError(result.error);
        } else { // If no error, set the data state with the result
          setData(result);
        }
      })
      .catch((err) => { // Catch any errors that occur during the fetch or parsing, logs any errors
        console.error("❌ Caught error in fetch:", err);
        setError("Network error. Could not fetch data.");
      });
  }, []);

  return (
    <>
      <Header />
      <div className="analyze-container">
        <Sidebar />
        <div className="main-content">
            <div className="dataset-display">
                <div className="dataset-header">
                  <h2>Dataset Display</h2>
                </div>
                 <div className="table-wrapper">
                  {/* Show error if there is one */}
                  {error && <p style={{color: "red"}}>{error}</p>}

                  {/* Show loading message while waiting */}
                  {!data && !error ? (
                    <p>Loading dataset...</p>
                  ) : null}

                  {/* If data is available, display it in a table */}
                  {data && (
                    <table>
                      <thead>
                        <tr>
                          {data.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {data.columns.map((col) => (
                              <td key={col}>{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
