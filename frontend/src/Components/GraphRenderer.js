import React from "react";
import Plot from "react-plotly.js";

//PROPS MEANING:
//type: type of graph
//data: array of data traces (x/y points, graph type, color, etc)
//layout: JS object containing graph options like title, axis labels, size
export default function GraphRender({type, data, layout}){ 
    return(
        <div className="graph-container">

            {/* Plot has props for data and layout
            The layout prop is spread to allow for additional customization, and a default title is provided in case there isn't one */}
            <Plot
                data={data}
                layout={{...layout, title: layout?.title || "Your Graph"}}
            />
        </div>
    )
}