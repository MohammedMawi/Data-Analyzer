import React from 'react';
import '../CSS/sidebar.css';

export default function Sidebar({columns, targetColumn, setTargetColumn, featureColumns, setFeatureColumns, removeFeature}) {
  return (
    <div className="sidebar">

      {/* Target Selection */}
      <div className="target-section">
        <label htmlFor="target-select">Target Column:
          <select
            id = "target-select"
            onChange = {(e) => setTargetColumn(e.target.value)} // When user picks an option, update the state with the selected value
            value={targetColumn}  // Set the value of the select to the current targetColumn state
          >
            <option value="">-- Select a column --</option>
            {columns.map((col) => (
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
          value={featureColumns} // Set the value to the current featureColumns state
          onChange={(e) => { 
            const newSelected = Array.from(e.target.selectedOptions).map(options => options.value) // Convert selected options to an array and extract just the values
            setFeatureColumns(prev => {
              const combined = [... new Set([...prev, ...newSelected])]; // Combine previous features with newly selected ones, and put it in a Set ensuring no duplicates, use spread operator to extract values from the Set and convert it to an array
              return combined;
            })
          }}
        >
          {columns.map(col => ( // Map through columns to create options for the select dropdown
            <option key={col} value={col}>
              {col}
            </option> 
          ))}
        </select>
      </div>

      {/* Display Selected Features */}
      <div className='selected-features'>
        <strong>Selected Features:</strong>
        <ul> 
           {/* Map through featureColumns to create a list of selected features */}
          {featureColumns.map(col => 
            <li
              key={col}
              className='feature-item'
              onClick={() => removeFeature(col)}
              title="Click to remove"
            >
              {col}
              <span className='remove-icon'>❌</span>
            </li>
          )}
        </ul>
      </div>

      <button>All</button>
      <div className="feature-list">
        <p>Feature 1</p>
        <p>Feature 2</p>
        {/* Later we’ll render this dynamically from the dataset */}
      </div>
      <button>Correlation</button>
      <button>Summary Stats</button>
      <button>Graphs</button>
      <button>Data Cleaning</button>
    </div>
  );
}
