'use client';

import { useChatStore } from "@/store/useChatStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

export default function VisualizationWindow() {
  const visualization = useChatStore((s) => s.visualization);
  const selectedIndex = useChatStore((s) => s.selectedChartIndex);

  if (!visualization || visualization.charts.length === 0 || selectedIndex === null) {
    return <div className="text-center text-muted-foreground p-4">No visualization selected.</div>;
  }

  const chart = visualization.charts[selectedIndex];

  const data = chart.bins.map((bin, i) => {
    const point: Record<string, number> = { bin };
    chart.series.forEach((s) => {
      point[s.label] = s.values[i];
    });
    return point;
  });

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2">{chart.chartTitle}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" label={{ value: chart.xAxisLabel, position: "insideBottomRight", offset: -5 }} />
            <YAxis label={{ value: chart.yAxisLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            {chart.series.map((s, i) => (
              <Line
                key={s.label}
                type="monotone"
                dataKey={s.label}
                stroke={`hsl(${(i * 70) % 360}, 70%, 50%)`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
