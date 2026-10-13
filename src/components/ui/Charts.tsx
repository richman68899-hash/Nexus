import { useState } from 'react';

export interface ChartPoint {
  label: string;
  value: number;
}

interface ChartProps {
  data: ChartPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  color?: string;
  title?: string;
}

const CHART_WIDTH = 600;

function thinningStep(count: number): number {
  return Math.max(1, Math.ceil(count / 10));
}

export function BarChart({ data, height = 180, formatValue, color, title = 'Bar chart' }: ChartProps) {
  const paddingLeft = 8;
  const paddingBottom = 22;
  const paddingTop = 20;
  const paddingRight = 8;
  const chartWidth = CHART_WIDTH - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const barGap = data.length > 0 ? chartWidth / data.length : chartWidth;
  const barWidth = Math.max(3, barGap * 0.55);
  const fill = color ?? 'var(--accent)';
  const step = thinningStep(data.length);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} className="w-full" role="img" aria-label={title}>
      {[0, 0.5, 1].map((g) => {
        const y = paddingTop + chartHeight * (1 - g);
        return (
          <line key={g} x1={paddingLeft} x2={CHART_WIDTH - paddingRight} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
        );
      })}
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = paddingLeft + i * barGap + (barGap - barWidth) / 2;
        const y = paddingTop + chartHeight - barHeight;
        const isHover = hoverIndex === i;
        return (
          <g key={`${d.label}-${i}`} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
            <rect x={x - 2} y={paddingTop} width={barWidth + 4} height={chartHeight} fill="transparent" />
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, d.value > 0 ? 2 : 0)}
              rx={2.5}
              fill={fill}
              opacity={isHover ? 1 : 0.78}
            />
            {(i % step === 0 || data.length <= 10) && (
              <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" fontSize={9} fill="var(--text-faint)">
                {d.label}
              </text>
            )}
            {isHover && (
              <text x={x + barWidth / 2} y={Math.max(y - 6, 10)} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--text)">
                {formatValue ? formatValue(d.value) : d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data, height = 180, formatValue, color, title = 'Line chart' }: ChartProps) {
  const paddingLeft = 8;
  const paddingBottom = 22;
  const paddingTop = 20;
  const paddingRight = 8;
  const chartWidth = CHART_WIDTH - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const stroke = color ?? 'var(--accent)';
  const step = thinningStep(data.length);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = data.map((d, i) => {
    const x = data.length <= 1 ? paddingLeft : paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const baseline = paddingTop + chartHeight;
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baseline} L ${points[0].x.toFixed(1)} ${baseline} Z`
      : '';

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} className="w-full" role="img" aria-label={title}>
      {[0, 0.5, 1].map((g) => {
        const y = paddingTop + chartHeight * (1 - g);
        return (
          <line key={g} x1={paddingLeft} x2={CHART_WIDTH - paddingRight} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
        );
      })}
      {areaPath && <path d={areaPath} fill={stroke} opacity={0.08} stroke="none" />}
      {points.length > 0 && (
        <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {points.map((p, i) => (
        <g key={`${p.label}-${i}`} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
          <circle cx={p.x} cy={p.y} r={9} fill="transparent" />
          <circle cx={p.x} cy={p.y} r={hoverIndex === i ? 4 : 2.5} fill={stroke} />
          {(i % step === 0 || points.length <= 10) && (
            <text x={p.x} y={height - 6} textAnchor="middle" fontSize={9} fill="var(--text-faint)">
              {p.label}
            </text>
          )}
          {hoverIndex === i && (
            <text x={p.x} y={Math.max(p.y - 10, 10)} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--text)">
              {formatValue ? formatValue(p.value) : p.value}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

