import React from 'react';
import '../CSS/sidebar.css';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <button>Target</button>
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
