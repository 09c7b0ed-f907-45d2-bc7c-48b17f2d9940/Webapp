"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { ScatterChartDTO } from "@/models/dto/charts";

interface Props {
  chart: ScatterChartDTO;
}

export function ScatterChartView({ chart }: Props) {
  // Flatten each series to include its name so we can plot multiple series.
  const data = chart.series.flatMap((series) =>
    series.data.map((point) => ({
      x: point.x,
      y: point.y,
      series: series.name,
    })),
  );

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2">{chart.metadata.title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              name={chart.metadata?.x_axis?.label ?? ""}
              label={{
                value: chart.metadata?.x_axis?.label ?? "",
                position: "insideBottomRight",
                offset: -5,
              }}
            />
            <YAxis
              dataKey="y"
              name={chart.metadata?.y_axis?.label ?? ""}
              label={{
                value: chart.metadata?.y_axis?.label ?? "",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend />
            {chart.series.map((series, index) => (
              <Scatter
                key={series.name}
                name={series.name}
                dataKey="y"
                data={data.filter((d) => d.series === series.name)}
                fill={`hsl(${(index * 70) % 360}, 70%, 50%)`}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
