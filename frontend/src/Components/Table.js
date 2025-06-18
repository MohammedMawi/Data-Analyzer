import "../CSS/table.css";

export default function Table({data, error}){
    return (
        <>
            <h2>Dataset Display</h2>

            <div className="table-wrapper">
                {/* Show error if there is one */}
                {error && <p style={{color: "red"}}>{error}</p>}

                {/* Show loading message while waiting */}
                {!data && !error ? (
                <p>Loading dataset...</p>
                ) : null}

                {/* If data is available, display it in a table */}
                {data && (
                <table>
                    <thead>
                    <tr>
                        {data.columns.map((col) => (
                        <th key={col}>{col}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {data.rows.map((row, rowIndex) => ( // 1. Loop through each row, rowIndex is the index of the row which is used as a key for each row. 
                        <tr key={rowIndex}>
                        {data.columns.map((col) => ( // 2. Loop through each column
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