import '../CSS/datainfo.css';

export default function DataInfo(props) {

    // Format helpers
    const isEmpty = (v) => v === null || v === undefined || v === "";
    const fmt = (n, d = 2) => (n === null || n === undefined ? "—" : Number(n).toFixed(d));
    const fmtPct = (n) => `${(Math.max(0, Math.min(1, n)) * 100).toFixed(1)}%`;

    // Infer type of column based on its values
    function inferType(values) {
      let num = 0, bool = 0, dt = 0, total = 0;

      for(const v of values){
        if(isEmpty(v)) continue;

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
          if(isEmpty(v)) miss++;
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
      const topMissing = [...missingByCol].sort((a, b) => b.pct - a.pct).slice(0,5);

      // Top-5 by cardinality
      const topCardinality = [...uniqueByCol].sort((a, b) => b.uniq - a.uniq).slice(0,5);

      // Overall (rough) avg missing
      const missingOverall = missingByCol.reduce((acc, curr) => acc + curr.pct, 0) / (missingByCol.length || 1);

      // Max cardinality for scaling bars
      const maxUniq = topCardinality.length ? topCardinality[0].uniq : 1;
      
      return {
        rows: rows.length,
        cols: columns.length,
        typeCounts,
        topMissing,
        missingOverall,
        topCardinality,
        maxUniq
      }
      
    }

    // Component to render type pills
    function TypePills({ typeCounts }) {
      const parts = Object.entries(typeCounts).map(([k, v]) => <span key={k} className={`pill ${k}`}>{k}: {v}</span>);

      return parts.length ? <div className="type-pills">{parts}</div> : <div className="muted">—</div>;
    }

    function renderSummary(summary) {
      const { rows, cols, typeCounts, missingOverall, topMissing, topCardinality, maxUniq } = summary;

      const donutPct = fmtPct(missingOverall);; // custom property for CSS donut

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

    // Calculate quantile (q between 0 and 1) of a sorted array using linear interpolation
    // E.g. [10, 20, 30, 40], 0.5 (median)
    // pos = (4 - 1) * 0.5 = 1.5
    // base = 1, rest = 0.5
    // interpolated between 20 and 30 → 20 + 0.5*(30 - 20) = 25
    function quantile(sorted, q) {
      if (!sorted.length) return null;

      const position = (sorted.length - 1) * q; //multiplying quantile(q) by (length - 1) gives us the exact position of the quantile value in the sorted array
      const base = Math.floor(position); //base is the integer part of the position, used as the lower index for interpolation
      const rest = position - base; //rest is the fractional part of the position, tells us how far we need to go between base and base + 1 to get the quantile value. I.E the slope between the two points
      
      if (rest !== 0 && sorted[base + 1] !== undefined) { //checks if we are not at the end of the array
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);  // linear interpolation formula
      }
      return sorted[base]; 
    }

    // Compute basic stats for a numeric array: count, mean, std, min, q1, median, q3, max
    function numericStats(values) {
      const nums = values
        .map(Number)
        .filter((v) => Number.isFinite(v))
        .sort((a, b) => a - b); // convert to numbers, filter out non-finite values, sort by ascending
      if (!nums.length) return null;

      const n = nums.length;
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
      const std = Math.sqrt(variance); // standard deviation is the square root of variance per the formula

      return {
        count: n,
        mean,
        std,
        min: nums[0],
        q1: quantile(nums, 0.25),
        median: quantile(nums, 0.5),
        q3: quantile(nums, 0.75),
        max: nums[nums.length - 1],
      };
    }

    // get top-K most frequent categories in a column
    function topKCategories(values, k = 5) {
      const freq = new Map();
      for (const v of values) {
        if(isEmpty(v)) continue;
        const key = String(v);
        freq.set(key, (freq.get(key) || 0) + 1); // If key exists, increment its count; otherwise, initialize it to 1
      }
      return Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1]) // Sort entries by count in descending order of count
        .slice(0, k)
        .map(([label, count]) => ({ label, count })); // Map to array of objects with label and count
    }

    function buildColumnsSummary(rows = [], columns = [], featureColumns = []) {
      const colsToSummarize = featureColumns?.length ? featureColumns : []; // only summarize selected features

      return colsToSummarize.map((col) => {
        const colVals = rows.map((r) => r[col]);
        const nonEmpty = colVals.filter((v) => v !== null && v !== undefined && v !== "");
        const missingPct = 1 - (nonEmpty.length / (rows.length || 1)); // get percentage of non-empty rows, get remainder to get empty rows
        const uniq = new Set(nonEmpty.map((v) => String(v))).size; // number of unique values
        const type = inferType(nonEmpty);

        let numeric = null;
        let cats = null;
        if (type === "numerical") {
          numeric = numericStats(nonEmpty);
        } else {
          cats = topKCategories(nonEmpty, 5);
        }

        return {
          col,
          type,
          missingPct,
          unique: uniq,
          numeric, // if numerical
          categories: cats, // if categorical/boolean/datetime
          total: rows.length
        };

      })
    }

    function renderColumnCards(colSummaries) {
      if (!colSummaries.length) {
        return (
          <section className="analysis-view">
            <div className="info-card">
              <h3>Column Summary</h3>
              <p className="muted">Select feature(s) to see per-column summaries.</p>
            </div>
          </section>
        );
      }

      // find max for category bars so they scale per-card
      return (
        <section className="analysis-view">
          <div className="summary-beauty">
            <h3 className="grad-title">Column Summary ({colSummaries.length})</h3>

            <div className="col-grid">
              {colSummaries.map((s) => {
                const maxCat = s.categories?.length
                  ? Math.max(...s.categories.map(c => c.count))
                  : 1;

                return (
                  <div className="beauty-card col-card" key={s.col}>
                    <div className="col-head">
                      <div className="col-name mono">{s.col}</div>
                      <span className={`pill ${s.type}`}>{s.type}</span>
                    </div>

                    <div className="kpis">
                      <div className="kpi">
                        <div className="label">Missing</div>
                        <div className="big">{fmtPct(s.missingPct)}</div>
                      </div>
                      <div className="kpi">
                        <div className="label">Unique</div>
                        <div className="big">{s.unique}</div>
                      </div>
                    </div>

                    {s.numeric ? (
                      <div className="num-grid">
                        <div><span className="label">Mean</span><div className="mono">{fmt(s.numeric.mean)}</div></div>
                        <div><span className="label">Std</span><div className="mono">{fmt(s.numeric.std)}</div></div>
                        <div><span className="label">Min</span><div className="mono">{fmt(s.numeric.min)}</div></div>
                        <div><span className="label">Q1</span><div className="mono">{fmt(s.numeric.q1)}</div></div>
                        <div><span className="label">Median</span><div className="mono">{fmt(s.numeric.median)}</div></div>
                        <div><span className="label">Q3</span><div className="mono">{fmt(s.numeric.q3)}</div></div>
                        <div><span className="label">Max</span><div className="mono">{fmt(s.numeric.max)}</div></div>
                      </div>
                    ) : (
                      <>
                        <div className="label" style={{marginTop:8, marginBottom:4}}>Top categories</div>
                        <ol className="nice-list">
                          {s.categories?.length ? s.categories.map((c) => (
                            <li key={c.label}>
                              <div className="row">
                                <span className="mono">{c.label}</span>
                                <span className="muted">{c.count}</span>
                              </div>
                              <div className="bar">
                                <div
                                  className="bar-fill"
                                  style={{ width: `${(c.count / maxCat) * 100}%` }}
                                />
                              </div>
                            </li>
                          )) : <div className="muted">—</div>}
                        </ol>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    return (
        <>
            {props.selectedInfo && (
              props.selectedInfo === "summary" 
              ? renderSummary(buildDatasetSummary(props.rows, props.cols))
              : props.selectedInfo === "summaryCol"
              ? renderColumnCards(buildColumnsSummary(props.rows, props.cols, props.featureColumns))
              : (
                <section className="analysis-view">
                  <div className="info-card">
                    <h3>Data Info: {props.selectedInfo}</h3>
                    <p>Coming soon.</p>
                  </div>
                </section>
              )
            )}
        </>
    )
}