"use client";

import {
  RadarChart as RCRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RadarChartDTO } from "@/models/dto/charts";

interface Props {
  chart: RadarChartDTO;
}

export function RadarChartView({ chart }: Props) {
  const data = chart.axes.map((axis) => {
    const point: Record<string, number | string> = { axis };
    chart.series.forEach((s) => {
      const val = s.data.find((p) => String(p.x) === String(axis))?.y ?? NaN;
      point[s.name] = val;
    });
    return point;
  });

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2">{chart.metadata.title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RCRadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" />
            <PolarRadiusAxis />
            <Legend />
            <Tooltip />
            {chart.series.map((s, i) => (
              <Radar
                key={s.name}
                name={s.name}
                dataKey={s.name}
                stroke={`hsl(${(i * 70) % 360}, 70%, 50%)`}
                fill={`hsl(${(i * 70) % 360}, 70%, 50%)`}
                fillOpacity={0.3}
              />
            ))}
          </RCRadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
