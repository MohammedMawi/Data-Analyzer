import { useEffect, useState } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import Table from "./Table";
import "../CSS/analyze.css";
import DataInfo from './DataInfo';
import GraphInfo from './GraphInfo';

export default function Analyze() {

    const [data, setData] = useState(null); // For table data
    const [error, setError] = useState(""); // For any fetch errors

    const [targetColumn, setTargetColumn] = useState(""); // For target column selection
    const [featureColumns, setFeatureColumns] = useState([]); // For feature columns selection

    const [selectedGraph, setSelectedGraph] = useState(null);
    const [selectedInfo, setSelectedInfo] = useState(null);

    const removeFeature = (featureToRemove) => {
      setFeatureColumns((prev) =>
        prev.filter(feature => feature !== featureToRemove) // Use filter to go through the previous elements and return a new array that does not include the feature to remove
      );
    };

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
        <Sidebar   
          columns={data ? data.columns : []} //Pass empty array if data not yet loaded since you have to wait for fetch to finish
          targetColumn={targetColumn} 
          setTargetColumn={setTargetColumn}
          featureColumns={featureColumns}
          setFeatureColumns={setFeatureColumns}
          removeFeature={removeFeature}
          setSelectedGraph={setSelectedGraph}
          setSelectedInfo={setSelectedInfo}
        />
          
        <div className="main-content">
          <div className="dataset-display">
            <Table data={data} error={error}/>
          </div>

          {data && 
            <GraphInfo 
              data={data} 
              rows={data.rows} 
              selectedGraph={selectedGraph} 
              featureColumns={featureColumns} 
              targetColumn={targetColumn} 
            />}

          {data && 
            <DataInfo selectedInfo={selectedInfo} rows={data.rows} cols={data.columns} />}

        </div>
      </div>
    </>
  );
}
