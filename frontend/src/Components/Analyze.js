import { useEffect, useState } from 'react';
import Header from "./Header";
import Sidebar from "./Sidebar";
import Table from "./Table";
import GraphRenderer from './GraphRenderer';
import "../CSS/analyze.css";

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

    //rows: array of data rows
    //features: col name for x-axis (categorical)
    //target: col name for y-axis (numeric)
    //maxCats: max number of categories to include (default 20)
    // For bar charts: compute mean(target) per feature category so we plot one bar per group, not one per row. E.g. mean house price per bedroom count
    function groupMean(rows, features, target, maxCats = 20) {
      const sum = new Map();    // key -> sum(y)
      const count = new Map();  // key -> count

      for (const r of rows) {
        const y = Number(r[target]); // convert target value to number in each row
        if (!Number.isFinite(y)) continue;

        // treat the x value as a category label (string) for grouping
        const key = String(r[features]);
        sum.set(key, (sum.get(key) || 0) + y); //set the sum for this key to the current sum + y (or just y if no current sum) to track total y-values per category
        count.set(key, (count.get(key) || 0) + 1); //set the count for this key to the current count + 1 (or just 1 if no current count) to track how many times each category appears
      }

      // turn sum map into array of 2-item arrays ([[key, mean], [key2, mean2]...]) pairs
      let entries = Array.from(sum.entries()).map(([k, valSum]) => [k, valSum / count.get(k)]);

      // Optionally trim to most frequent categories if too many
      if (entries.length > maxCats) {
        entries.sort((a, b) => (count.get(b[0]) || 0) - (count.get(a[0]) || 0)); //use sort method to sort entries by count descending using b-a
        entries = entries.slice(0, maxCats); //keep only the most frequent features
      }

      // sort feat/key names numerically. a/b[0] refers to first element (features/keys) of each pair
      entries.sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

      const x = entries.map(([k]) => k); //create x array and extract first element of each pair
      const y = entries.map(([, m]) => m); //create y array and extract second element of each pair
      return { x, y }; //return the x and y arrays as an object
    }

    // ---- Generic trace builder (supports line + scatter; easy to extend) ----
    const TRACE_KINDS = {
      line: (x, y, name) => ({
        x,
        y,
        type: "scatter",
        mode: "lines+markers",
        name,
      }),
      scatter: (x, y, name) => ({
        x,
        y,
        type: "scatter",
        mode: "markers",
        marker: { size: 7 },
        name,
      }),
      bar: (x, y, name) => ({
        x,
        y,
        type: "bar",
        name,
      })
    };

    //convert value to a number and return boolean indicating if it is a finite number
    function isFiniteNumber(v) {
      const n = Number(v);
      return Number.isFinite(n);
    }

    // rows: array of data rows
    // target: col name for y-axis
    // features: array of feature col names for x-axis
    // kind: "line" or "scatter"
    function buildTraces(rows, target, features, kind) {
      const makeTrace = TRACE_KINDS[kind];
      if (!makeTrace || !rows || !target || !features?.length) return []; // Return empty if no valid trace kind or missing data

      // Special path for bar: aggregate mean(target) per category of each feature
      if (kind === "bar") {
        return features
          .map((feat) => {
            const { x, y } = groupMean(rows, feat, target);
            if (x.length === 0) return null;
            // To avoid x-label collisions across different features, prefix with feature name when multiple features are selected
            const labeledX = features.length > 1 ? x.map((v) => `${feat}: ${v}`) : x;
            return makeTrace(labeledX, y, `${feat} → ${target}`);
          })
          .filter(Boolean);
      }

      // loop through each feature to compare with target
      return features.map((feat) => {
          // create point object for each row and keep only rows where BOTH values are numeric
          const pts = rows.map((r) => 
            ({ x: Number(r[feat]), y: Number(r[target]) })).filter((p) => 
              isFiniteNumber(p.x) && isFiniteNumber(p.y));

          // extract x and y arrays from points and return null if no points
          const x = pts.map((p) => p.x);
          const y = pts.map((p) => p.y);
          if (x.length === 0) return null;

          // Return the actual trace object using the makeTrace helper for this graph type
          return makeTrace(x, y, `${feat} → ${target}`);
        })
        .filter(Boolean);
    }

    function buildLineFromDataset(rows, xKey, yKey) {
      const xs = [];
      const ys = [];
      for (const r of rows) {
        const x = Number(r[xKey]);
        const y = Number(r[yKey]);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          xs.push(x);
          ys.push(y);
        }
      }
      return [
        {
          x: xs,
          y: ys,
          type: "scatter",
          mode: "lines+markers",
          name: `${yKey} vs ${xKey}`,
        },
      ];
    }

    const xName = featureColumns?.length === 1 ? featureColumns[0] : "Feature(s)";

    const lineData =
      selectedGraph === "line" &&
      data &&
      targetColumn &&
      xName
        ? buildLineFromDataset(data.rows, xName, targetColumn)
        : [];

    const lineLayout = {
      title: {
        text:
          targetColumn && xName
            ? `${targetColumn} vs ${xName}`
            : "Line Graph",
        font: { size: 20, color: "black" }, // Explicit font styling
        xref: 'paper',
        x: 0.5, // Center title
      },
      xaxis: {
        title: { text: xName || "Feature", font: { size: 16, color: "black" } }
      },
      yaxis: {
        title: { text: targetColumn || "Target", font: { size: 16, color: "black" } }
      },
      height: 420,
      margin: { l: 60, r: 20, t: 80, b: 50 }, // Increase top margin
    };


    const graphData =
      selectedGraph &&
      data &&
      targetColumn &&
      featureColumns?.length
        ? buildTraces(data.rows, targetColumn, featureColumns, selectedGraph)
        : [];

    const kindLabel = selectedGraph === "scatter" ? "Scatter" : 
                      selectedGraph === "bar"     ? "Bar"     : "Line";

    // (temporary) reuse your existing lineLayout, but update the title label by graph kind
    const graphLayout = {
      ...lineLayout,
      barmode: selectedGraph === "bar" && featureColumns?.length > 1 ? "stack" : undefined,
      title: {
        ...(typeof lineLayout.title === "object" ? lineLayout.title : { text: lineLayout.title }),
        text:
          targetColumn && featureColumns?.length
            ? `${kindLabel}: ${targetColumn} vs ${featureColumns.join(", ")}`
            : (typeof lineLayout.title === "object" ? lineLayout.title.text : "Graph"),
      },
      xaxis: {
        ...(typeof lineLayout.xaxis === "object" ? lineLayout.xaxis : {}),
        automargin: true,
        title: {
          text:
            selectedGraph === "bar" 
              ? (featureColumns?.length === 1 ? featureColumns[0] : "Feature Categories") 
              : xName,
        }
      },
      yaxis: {
        ...(typeof lineLayout.yaxis === "object" ? lineLayout.yaxis : {}),
        title: {
          text: 
            selectedGraph === "bar" 
              ? `Mean ${targetColumn || "Target"}`
              : `${targetColumn || "Target"}`
        }
      }
    };

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

          {selectedGraph && (
            <section className="analysis-view">
              {!data ? (
                <p>Loading data…</p>
              ) : !targetColumn || !featureColumns?.length ? (
                <p>Please select a target column and at least one feature.</p>
              ) : graphData.length === 0 || graphData.every(t => !t || t.x?.length === 0) ? (
                <p>No numeric pairs found for the selected columns.</p>
              ) : (
                <GraphRenderer type={selectedGraph} data={graphData} layout={graphLayout} />
              )}
            </section>
          )}

          {selectedInfo && (
            <div className="analysis-view">
              <h3>Data Info View: {selectedInfo}</h3>
              <p>(Placeholder for {selectedInfo} data info)</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
