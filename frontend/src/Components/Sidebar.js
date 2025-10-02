import React from 'react';
import '../CSS/sidebar.css';

export default function Sidebar(props) {
  return (
    <div className="sidebar">

      {/* Target Selection */}
      <div className="target-section">
        <label htmlFor="target-select">Target Column:
          <select
            id = "target-select"
            onChange = {(e) => props.setTargetColumn(e.target.value)} // When user picks an option, update the state with the selected value
            value={props.targetColumn}  // Set the value of the select to the current targetColumn state
          >
            <option value="" disabled>-- Select a Column --</option>
            {props.columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}

          </select>
        </label>
      </div>
      
      {/* Feature Selection */}
      <div className = "feature-section">
        <label htmlFor='feature-select'>
          <strong>Feature Selection</strong>
        </label>
        <select
          id = "feature-select"
          multiple // Allows multiple selections
          value={props.featureColumns} // Set the value to the current featureColumns state
          onChange={(e) => { 
            const newSelected = Array.from(e.target.selectedOptions).map(options => options.value) // Convert selected options to an array and extract just the values
            props.setFeatureColumns(prev => {
              const combined = [... new Set([...prev, ...newSelected])]; // Combine previous features with newly selected ones, and put it in a Set ensuring no duplicates, use spread operator to extract values from the Set and convert it to an array
              return combined;
            })
          }}
        >
          {props.columns.map(col => ( // Map through columns to create options for the select dropdown
            <option key={col} value={col}>
              {col}
            </option> 
          ))}
        </select>
      </div>

      {/* Display Selected Features */}
      <div className='selected-features'>
        <strong>Selected Features:</strong>
        <div className="selected-features-scroll">
          <ul> 
            {/* Map through featureColumns to create a list of selected features */}
            {props.featureColumns.map(col => 
              <li
                key={col}
                className='feature-item'
                onClick={() => props.removeFeature(col)}
                title="Click to remove"
              >
                <span className="feature-text">{col}</span>
                <span className="remove-icon">❌</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Graph Display Dropdown */}
      <div className="dropdown-section">
        <label><strong>Graph Display</strong></label>

        <select
          onChange={(e) => {
            props.setSelectedGraph(e.target.value);
            props.setSelectedInfo(null); // Clear other view when switching
          }}
          defaultValue=""
        >
          <option value="" disabled>-- Select a Graph --</option>
          <option value="bar">Bar Graph</option>
          <option value="line">Line Graph</option>
          <option value="scatter">Scatter Plot</option>
          <option value="box">Box Plot</option>
          <option value="hist">Histogram</option>
        </select>
      </div>

      {/* Data Info Dropdown */}
      <div className="dropdown-section">
        <label><strong>Data Info</strong></label>
        <select
          onChange={(e) => {
            props.setSelectedInfo(e.target.value);
            props.setSelectedGraph(null); // Clear other view when switching
          }}
          defaultValue=""
        >
          <option value="" disabled>-- Choose info type --</option>
          <option value="summary">Summary</option>
          <option value="summaryCol">Column Summary</option>
          <option value="correlation">Correlation</option>
          <option value="graphInsight">Graph Insight</option>
          <option value="quality">Data Quality</option>
        </select>
      </div>

    </div>
  );
}
