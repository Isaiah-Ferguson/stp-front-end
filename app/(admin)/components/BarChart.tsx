type Bar = { pct: number; day: string };

type Column = { dotClass: string; label: string; bars: Bar[] };

export default function BarChart({ columns }: { columns: Column[] }) {
  return (
    <div className="chart3" role="img" aria-label="Weekly attendance chart">
      {columns.map((col) => (
        <div className="chart-col" key={col.label}>
          <div className="chart-head">
            <span className={`ss-dot ${col.dotClass}`} aria-hidden />
            <span>{col.label}</span>
          </div>
          <div className="bars">
            {col.bars.map((b) => (
              <div className="bar-wrap" key={b.day}>
                <span className="bar-pct">{b.pct}%</span>
                <span
                  className={`bar ${col.dotClass}`}
                  style={{ height: `${b.pct}%` }}
                  role="img"
                  aria-label={`${b.day}: ${b.pct} percent`}
                />
                <span className="bar-day">{b.day}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
