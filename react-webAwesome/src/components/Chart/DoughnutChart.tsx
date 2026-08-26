// DoughnutChart.tsx

import type { DoughnutChartProps } from "@/types";

import "./DoughnutChart.css";

const DoughnutChart = ({ segments, size = 180, label }: DoughnutChartProps) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const stops = segments
    .map((s, i) => {
      const prev = segments.slice(0, i).reduce((sum, x) => sum + x.value, 0);
      const start = (prev / total) * 100;
      const end = ((prev + s.value) / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="doughnut">
      <div className="doughnut__figure" style={{ width: size, height: size }}>
        <div
          className="doughnut__ring"
          role="img"
          aria-label={label}
          style={{ background: `conic-gradient(${stops})` }}
        />
        <div className="doughnut__hole">
          <span className="doughnut__total">{total}</span>
          <span className="doughnut__unit">total</span>
        </div>
      </div>

      <ul className="doughnut__legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="doughnut__swatch" style={{ background: s.color }} />
            {s.label}
            <span className="doughnut__value">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DoughnutChart;
