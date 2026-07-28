"use client";

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
import type { LineChartDTO } from "@/models/dto/charts";
import { trimEmptyEdgeChartPoints } from "@/lib/chart-utils";

interface Props {
  chart: LineChartDTO;
}

export function LineChartView({ chart }: Props) {
  const seriesNames = chart.series.map((series) => series.name);
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
    const point: Record<string, number | string | null> = { bin };
    chart.series.forEach((s) => {
      const val = s.data.find((p) => String(p.x) === String(bin))?.y;
      point[s.name] = typeof val === "number" && val === 0 ? null : (val ?? null);
    });
    return point;
  });
  const trimmedData = trimEmptyEdgeChartPoints(data, seriesNames);

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2 text-primary">{chart.metadata.title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trimmedData} margin={{ top: 20, right: 20, bottom: 0, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="bin"
                tickFormatter={(value) => {
                  if (typeof value === "number" && value > 1000000000) {
                    const date = new Date(value * 1000);
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    return `Q${quarter} ${date.getFullYear()}`;
                  }
                  return String(value);
                }}
                interval="preserveStartEnd"
                label={{
                  value: chart.metadata?.x_axis?.label ?? "",
                  position: "insideBottomRight",
                  offset: -5,
                }}
              />
            <YAxis
              label={{
                value: chart.metadata?.y_axis?.label ?? "",
                angle: -90,
                position: "center",
                dx: -20,
              }}
            />
           <Tooltip 
              animationEasing="spring"
              contentStyle={{ backgroundColor: "var(--card)", borderRadius: "var(--radius)",  minWidth: "100px", fontSize: "0.75rem", fontWeight: "bold" }}
            />            
            <Legend />
            {chart.series.map((s, i) => (
              <Line
                key={s.name}
                type={chart.smooth ? "monotone" : "linear"}
                dataKey={s.name}
                stroke={`hsl(${(i * 70) % 360}, 70%, 50%)`}
                strokeWidth={2}
                dot={{
                  r: 10,
                  fill: "var(--primary-foreground)",
                  stroke: `hsl(${(i * 70) % 360}, 70%, 50%)`,
                  strokeWidth: 3,
                }}
                activeDot={{
                  r: 15,
                  fill: `hsl(${(i * 70) % 360}, 70%, 50%)`,
                  stroke: "var(--primary-foreground)",
                  strokeWidth: 3,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
