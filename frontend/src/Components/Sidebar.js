import React from 'react';
import '../CSS/sidebar.css';

export default function Sidebar({columns, targetColumn, setTargetColumn}) {
  return (
    <div className="sidebar">
      
      <div className="target-section">
        <label htmlFor="target-select">Target Column:
          <select
            id = "target-select"
            value={targetColumn}  // Controlled input: dropdown always reflects the selected state
            onChange = {(e) => setTargetColumn(e.target.value)} // When user picks an option, update the state with the selected value
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
