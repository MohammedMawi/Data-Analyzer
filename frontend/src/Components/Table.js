import "../CSS/table.css";

export default function Table(props){
    return (
        <>
            <h2>Dataset Display</h2>

            <div className="table-wrapper">
                {/* Show error if there is one */}
                {props.error && <p style={{color: "red"}}>{props.error}</p>}

                {/* Show loading message while waiting */}
                {!props.data && !props.error ? (
                <p>Loading dataset...</p>
                ) : null}

                {/* If data is available, display it in a table */}
                {props.data && (
                <table>
                    <thead>
                    <tr>
                        {props.data.columns.map((col) => (
                        <th key={col}>{col}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {props.data.rows.map((row, rowIndex) => ( // 1. Loop through each row, rowIndex is the index of the row which is used as a key for each row. 
                        <tr key={rowIndex}>
                        {props.data.columns.map((col) => ( // 2. Loop through each column
                            <td key={col}>{row[col]}</td> // 3. Use col name to use as key and get value the value for that key
                        ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
                )}
            </div>
        </>
    )
}