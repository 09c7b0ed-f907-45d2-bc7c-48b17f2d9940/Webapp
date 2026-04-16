"use client";

import {
  LineChart,
  Line,
  AreaChart as RCAreaChart,
  Area,
  BarChart as RCBarChart,
  Bar,
  ResponsiveContainer,
  PieChart as RCPieChart,
  Pie,
  Cell,
  RadarChart as RCRadarChart,
  Radar,
  ScatterChart as RCScatterChart,
  Scatter,
} from "recharts";
import type { 
  LineChartDTO, 
  AreaChartDTO, 
  BarChartDTO, 
  PieChartDTO, 
  RadarChartDTO,
  BoxChartDTO,
  ScatterChartDTO,
  HistogramChartDTO,
  WaterfallChartDTO,
} from "@/models/dto/charts";

// LINE CHART THUMBNAIL
export function LineChartThumbnail({ chart }: { chart: LineChartDTO }) {
  const bins: (string | number)[] = [];
  const seen = new Set<string>();
  chart.series.forEach((s) =>
    s.data.forEach((p) => {
      const k = String(p.x);
      if (!seen.has(k)) {
        seen.add(k);
        bins.push(p.x);
      }
    }),
  );

  const data = bins.map((bin) => {
    const point: Record<string, number | string> = { bin };
    chart.series.forEach((s) => {
      const val = s.data.find((p) => String(p.x) === String(bin))?.y ?? NaN;
      point[s.name] = val;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        {chart.series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={`hsl(${(i * 70) % 360}, 70%, 50%)`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// AREA CHART THUMBNAIL
export function AreaChartThumbnail({ chart }: { chart: AreaChartDTO }) {
  const bins: (string | number)[] = [];
  const seen = new Set<string>();
  chart.series.forEach((s) =>
    s.data.forEach((p) => {
      const k = String(p.x);
      if (!seen.has(k)) {
        seen.add(k);
        bins.push(p.x);
      }
    }),
  );

  const data = bins.map((bin) => {
    const point: Record<string, number | string> = { bin };
    chart.series.forEach((s) => {
      const val = s.data.find((p) => String(p.x) === String(bin))?.y ?? NaN;
      point[s.name] = val;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCAreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        {chart.series.map((s, i) => (
          <Area
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={`hsl(${(i * 70) % 360}, 70%, 50%)`}
            fill={`hsl(${(i * 70) % 360}, 70%, 50%)`}
            fillOpacity={0.6}
            isAnimationActive={false}
          />
        ))}
      </RCAreaChart>
    </ResponsiveContainer>
  );
}

// BAR CHART THUMBNAIL
export function BarChartThumbnail({ chart }: { chart: BarChartDTO }) {
  const bins: (string | number)[] = [];
  const seen = new Set<string>();
  chart.series.forEach((s) =>
    s.data.forEach((p) => {
      const k = String(p.x);
      if (!seen.has(k)) {
        seen.add(k);
        bins.push(p.x);
      }
    }),
  );

  const data = bins.map((bin) => {
    const point: Record<string, number | string> = { bin };
    chart.series.forEach((s) => {
      const val = s.data.find((p) => String(p.x) === String(bin))?.y ?? NaN;
      point[s.name] = val;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCBarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        {chart.series.map((s, i) => (
          <Bar
            key={s.name}
            dataKey={s.name}
            fill={`hsl(${(i * 70) % 360}, 70%, 50%)`}
            isAnimationActive={false}
          />
        ))}
      </RCBarChart>
    </ResponsiveContainer>
  );
}

// PIE CHART THUMBNAIL
export function PieChartThumbnail({ chart }: { chart: PieChartDTO }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCPieChart>
        <Pie
          data={chart.data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={50}
          innerRadius={chart.donut ? 30 : 0}
          label={false}
          isAnimationActive={false}
        >
          {chart.data.map((s, i) => (
            <Cell
              key={`slice-${i}`}
              fill={s.color || `hsl(${(i * 70) % 360}, 70%, 50%)`}
            />
          ))}
        </Pie>
      </RCPieChart>
    </ResponsiveContainer>
  );
}

// RADAR CHART THUMBNAIL
export function RadarChartThumbnail({ chart }: { chart: RadarChartDTO }) {
  const data = chart.axes.map((axis) => {
    const point: Record<string, number | string> = { axis };
    chart.series.forEach((s) => {
      const val = s.data.find((p) => String(p.x) === String(axis))?.y ?? NaN;
      point[s.name] = val;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCRadarChart data={data}>
        {chart.series.map((s, i) => (
          <Radar
            key={s.name}
            name={s.name}
            dataKey={s.name}
            stroke={`hsl(${(i * 70) % 360}, 70%, 50%)`}
            fill={`hsl(${(i * 70) % 360}, 70%, 50%)`}
            fillOpacity={0.3}
            isAnimationActive={false}
          />
        ))}
      </RCRadarChart>
    </ResponsiveContainer>
  );
}

// SCATTER CHART THUMBNAIL
export function ScatterChartThumbnail({ chart }: { chart: ScatterChartDTO }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        {chart.series.map((s, i) => (
          <Scatter
            key={s.name}
            name={s.name}
            data={s.data.map((p) => ({ x: p.x, y: p.y }))}
            fill={`hsl(${(i * 70) % 360}, 70%, 50%)`}
            isAnimationActive={false}
          />
        ))}
      </RCScatterChart>
    </ResponsiveContainer>
  );
}

// BOX CHART THUMBNAIL
export function BoxChartThumbnail({ chart }: { chart: BoxChartDTO }) {
  const data = chart.data.map((entry) => ({
    name: entry.name,
    q1: entry.q1,
    median: entry.median,
    q3: entry.q3,
    min: entry.min,
    max: entry.max,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCBarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey="median" fill="hsl(200, 70%, 50%)" isAnimationActive={false} />
      </RCBarChart>
    </ResponsiveContainer>
  );
}

// HISTOGRAM CHART THUMBNAIL
export function HistogramChartThumbnail({ chart }: { chart: HistogramChartDTO }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCBarChart data={chart.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey="count" fill="hsl(200, 70%, 50%)" isAnimationActive={false} />
      </RCBarChart>
    </ResponsiveContainer>
  );
}

// WATERFALL CHART THUMBNAIL
export function WaterfallChartThumbnail({ chart }: { chart: WaterfallChartDTO }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RCBarChart data={chart.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey="value" fill="hsl(200, 70%, 50%)" isAnimationActive={false} />
      </RCBarChart>
    </ResponsiveContainer>
  );
}
