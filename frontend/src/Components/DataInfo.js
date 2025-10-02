import '../CSS/datainfo.css';

export default function DataInfo(props) {
        // Helper to format percentage
    function fmtPct(n) { 
      return `${(n * 100).toFixed(1)}%`; 
    }

    // Infer type of column based on its values
    function inferType(values) {
      let num = 0, bool = 0, dt = 0, total = 0;

      for(const v of values){
        if(v === null || v === undefined || v === "") continue;

        total++;

        const s = String(v).trim().toLowerCase();
        const n = Number(v);

        if (Number.isFinite(n)) num++;
        else if (["true", "false", "yes", "no", "0", "1"].includes(s)) bool++;
        else if (!Number.isNaN(Date.parse(v))) dt++;
      }

      //Pick the majority type
      if(num / total > 0.7) return "numerical";
      else if (bool / total > 0.7) return "boolean";
      else if (dt / total > 0.7) return "datetime";
      return "categorical";
    }

    // Build a summary of the dataset: missing %, unique values, inferred type per column, etc
    function buildDatasetSummary(rows = [], columns = [], sampleSize = 500) {
      const sample = rows.slice(0, sampleSize);
      const missingByCol = [];
      const uniqueByCol = [];
      const typeByCol = [];

      for (const col of columns){
        let miss = 0;
        const uniq = new Set();
        const valsForTyping = [];

        for(const r of sample){
          const v = r[col];
          if(v === null || v === undefined || v === "") miss++;
          else{
            uniq.add(String(v));
            valsForTyping.push(v);
          }
        }

        missingByCol.push({col, pct: sample.length ? miss / sample.length : 0});
        uniqueByCol.push({col, uniq: uniq.size});
        typeByCol.push({col, type: inferType(valsForTyping)});
      }

      // Getting counts of each type
      // {type} is same as {type: type} - destructuring assignment
      // m[type] points to the value for that key in the object m
      const typeCounts = typeByCol.reduce((m, {type}) => {
        m[type] = (m[type] || 0) + 1;
        return m;
      }, {});

      // Top-5 columns by missing %
      const topMissing = missingByCol.sort((a, b) => b.pct - a.pct).slice(0,5);

      // Top-5 by cardinality
      const topCardinality = uniqueByCol.sort((a, b) => b.uniq - a.uniq).slice(0,5);

      // Overall (rough) avg missing
      const missingOverall = missingByCol.reduce((acc, curr) => acc + curr.pct, 0) / (missingByCol.length || 1);
      
      return {
        rows: rows.length,
        cols: columns.length,
        typeCounts,
        topMissing,
        missingOverall,
        topCardinality
      }
      
    }

    // Component to render type pills
    function TypePills({ typeCounts }) {
      const parts = Object.entries(typeCounts).map(([k, v]) => <span key={k} className={`pill ${k}`}>{k}: {v}</span>);

      return parts.length ? <div className="type-pills">{parts}</div> : <div className="muted">—</div>;
    }

    function renderSummary(summary) {
      const { rows, cols, typeCounts, missingOverall, topMissing, topCardinality, maxUniq } = summary;

      const donutPct = `${(missingOverall * 100).toFixed(1)}%`; // custom property for CSS donut

      return (
        <section className="analysis-view">
          <div className="summary-beauty">
            <h3 className="grad-title">Dataset Summary</h3>

            <div className="beauty-grid">
              {/* Stat: Rows */}
              <div className="beauty-card">
                <div className="label">Rows</div>
                <div className="big">{rows}</div>
              </div>

              {/* Stat: Columns */}
              <div className="beauty-card">
                <div className="label">Columns</div>
                <div className="big">{cols}</div>
              </div>

              {/* Donut: Missing */}
              <div className="beauty-card donut-wrap">
                <div className="label">Missing (overall)</div>
                <div
                  className="donut"
                  style={{ ["--p"]: `${(missingOverall * 100).toFixed(1)}%` }}
                  aria-label={`Missing ${donutPct}`}
                  title={`Missing ${donutPct}`}
                >
                  <span className="donut-val">{donutPct}</span>
                </div>
              </div>

              {/* Type pills */}
              <div className="beauty-card">
                <div className="label">Types</div>
                <TypePills typeCounts={typeCounts} />
              </div>
            </div>

            <div className="split">
              <div className="pane">
                <h4>Top Missing Columns</h4>
                {topMissing.length ? (
                  <ol className="nice-list">
                    {topMissing.map(({col, pct}) => (
                      <li key={col}>
                        <div className="row">
                          <span className="mono">{col}</span>
                          <span className="muted">{fmtPct(pct)}</span>
                        </div>
                        <div className="bar">
                          <div className="bar-fill" style={{ width: `${pct*100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : <div className="muted">No missing values</div>}
              </div>

              <div className="pane">
                <h4>Top Cardinality</h4>
                {topCardinality.length ? (
                  <ol className="nice-list">
                    {topCardinality.map(({col, uniq}) => (
                      <li key={col}>
                        <div className="row">
                          <span className="mono">{col}</span>
                          <span className="muted">{uniq} unique</span>
                        </div>
                        <div className="bar">
                          <div className="bar-fill alt" style={{ width: `${(uniq/maxUniq)*100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : <div className="muted">—</div>}
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
        <>
            {renderSummary(buildDatasetSummary(props.rows, props.cols))}
        </>
    )
}