import Header from "./Header";
import Sidebar from "./Sidebar";
import Table from "./Table";
import "../CSS/analyze.css";

export default function Analyze() {

  return (
    <>
      <Header />
      <div className="analyze-container">
        <Sidebar />
        <div className="main-content">
            <div className="dataset-display">
              <Table />
            </div>
        </div>
      </div>
    </>
  );
}
