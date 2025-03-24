import React from "react";
import { Routes, Route } from "react-router-dom";
import Upload from "./Components/Upload";
import Analyze from "./Components/Analyze";

function App() {
  return (
    // Routes is a component that wraps all the Route components. It is used to define the routes of the application.
    // Route is a component that is used to define the path of the route and the component that should be rendered when the path matches.
    <Routes>
      <Route path="/" element={<Upload />} />
      <Route path="/analyze" element={<Analyze />} />
    </Routes>
  )
}

export default App;
