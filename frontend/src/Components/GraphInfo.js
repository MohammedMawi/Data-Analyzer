import GraphRenderer from './GraphRenderer';

export default function GraphInfo(props){
   
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
      }),
      box: (x, y, name) => ({
        x,
        y,
        type: "box",
        name,
        boxpoints: "outliers",
        jitter: 0.3,
        whiskerwidth: 0.2,
        marker: {size: 4},
        line: {width: 1}
      }),
      hist: (x, y, name) => ({
        x,
        y,
        type: "histogram",
        name,
        opacity: 0.6,
        hoverlabel: { namelength: -1 }
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
      if (!makeTrace || !rows) return []; // Return empty if no valid trace type or no data

      //Histograms are used to show frequency of values in one or more columns not compare features vs target
      if (kind === "hist") {
        const cols = features?.length ? features : (target ? [target] : []); //if no features, use target as single column
        return cols //map over each feature
          .map((col) => {
            // map over each row and use feature (aka col) to search for values in specified column in each row
            const vals = rows.map(r => Number(r[col])).filter(v => Number.isFinite(v)); 
            return vals.length === 0 ? null : makeTrace(vals, null, col); //if no valid values, return null; otherwise create trace with vals as x and null as y
          }).filter(Boolean); //filter out any null traces
      }

      if (!target || !features?.length) return []; // Return empty if missing target or features

      // Special path for bar: aggregate mean(target) per category of each feature
      if (kind === "bar") {
        return features
          .map((feat) => {
            const { x, y } = groupMean(rows, feat, target);
            if (x.length === 0) return null;
            // To avoid x-label collisions across different features, prefix with feature name when multiple features are selected
            const labeledX = features.length > 1 ? x.map((v) => `${feat}: ${v}`) : x;
            return makeTrace(labeledX, y, feat);
          })
          .filter(Boolean);
      }

      if(kind === "box") {
        return features.map((feat) => {
          const pts = rows.filter((r) => Number.isFinite(Number(r[target]))); //filter dataset by rows where target column has a real value
          const x = pts.map((r) => String(r[feat])); // extract x values as strings (categories)
          const y = pts.map((r) => Number(r[target])); // extract y values as numbers (target values)
          return x.length === 0 ? null : makeTrace(x, y, feat); 
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
          return makeTrace(x, y, feat);
        })
        .filter(Boolean);
    }

    const xName = props.featureColumns?.length === 1 ? props.featureColumns[0] : "Feature(s)";

    const lineLayout = {
      title: {
        text:
          props.targetColumn && xName
            ? `${props.targetColumn} vs ${xName}`
            : "Line Graph",
        font: { size: 20, color: "black" }, // Explicit font styling
        xref: 'paper',
        x: 0.5, // Center title
      },
      xaxis: {
        title: { text: xName || "Feature", font: { size: 16, color: "black" } }
      },
      yaxis: {
        title: { text: props.targetColumn || "Target", font: { size: 16, color: "black" } }
      },
      height: 420,
      margin: { l: 60, r: 20, t: 80, b: 50 }, // Increase top margin
    };

    let graphData = [];

    if (props.selectedGraph && props.data) {
      if (props.selectedGraph === "hist" && (props.featureColumns?.length || props.targetColumn)) {
        graphData = buildTraces(props.rows, props.targetColumn, props.featureColumns, props.selectedGraph);
      } else if (props.targetColumn && props.featureColumns?.length) {
        graphData = buildTraces(props.rows, props.targetColumn, props.featureColumns, props.selectedGraph);
      }
    }

    const kindLabel = props.selectedGraph === "scatter" ? "Scatter" : 
                      props.selectedGraph === "bar"     ? "Bar"     : 
                      props.selectedGraph === "box"     ? "Box Plot": 
                      props.selectedGraph === "hist"     ? "Histogram"   : "Line";

    const plottingCols = props.featureColumns?.length ? props.featureColumns : (props.targetColumn ? [props.targetColumn] : []);

    // (temporary) reuse your existing lineLayout, but update the title label by graph kind
    const graphLayout = {
      ...lineLayout,
      barmode: props.selectedGraph === "bar" && props.featureColumns?.length > 1 ? "group" :
               props.selectedGraph === "hist" && (plottingCols?.length ?? 0) > 1 ? "overlay" : undefined,
      boxmode: props.selectedGraph === "box" && props.featureColumns?.length > 1 ? "group" : undefined,
      title: {
        ...(typeof lineLayout.title === "object" ? lineLayout.title : { text: lineLayout.title }),
        text:
          props.selectedGraph === "hist" 
            ? `${kindLabel}: ${plottingCols.join(", ")}`
              : props.targetColumn && props.featureColumns?.length
              ? `${kindLabel}: ${props.targetColumn} vs ${props.featureColumns.join(", ")}`
              : (typeof lineLayout.title === "object" ? lineLayout.title.text : "Graph"),
      },
      xaxis: {
        ...(typeof lineLayout.xaxis === "object" ? lineLayout.xaxis : {}),
        automargin: true,
        title: {
          text:
            props.selectedGraph === "hist" 
              ? (plottingCols?.length === 1 ? plottingCols[0] : "Values")
              : props.selectedGraph === "bar" || props.selectedGraph === "box"
              ? (props.featureColumns?.length === 1 ? props.featureColumns[0] : "Feature Categories") 
              : xName,
        }
      },
      yaxis: {
        ...(typeof lineLayout.yaxis === "object" ? lineLayout.yaxis : {}),
        title: {
          text: 
            props.selectedGraph === "hist"
              ? "Count"
              : props.selectedGraph === "box"
              ? `${props.targetColumn} Distribution`
              : props.selectedGraph === "bar" 
              ? `Mean ${props.targetColumn || "Target"}`
              : `${props.targetColumn || "Target"}`
        }
      }
    };

    return(
        <>
            {props.selectedGraph && (
            <section className="analysis-view">
              {!props.data ? (
                <p>Loading data…</p>
              ) : props.selectedGraph !== "hist" && (!props.targetColumn || !props.featureColumns?.length) ? (
                <p>Please select a target column and at least one feature</p>
              ) : plottingCols.length === 0 ? (
                <p>Please select at least one column (feature or target)</p>
              ) : graphData.length === 0 || graphData.every(t => !t || t.x?.length === 0) ? (
                <p>No numeric pairs found for the selected columns</p>
              ) : (
                <GraphRenderer type={props.selectedGraph} data={graphData} layout={graphLayout} />
              )}
            </section>
          )}
        </>
    )
}