"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { HistogramChartDTO } from "@/models/dto/charts";

interface Props {
  chart: HistogramChartDTO;
}

export function HistogramChartView({ chart }: Props) {
  const data = chart.data.map((bin, index) => ({
    index,
    range: `${bin.range_start} – ${bin.range_end}`,
    value: chart.cumulative ? bin.density ?? bin.frequency : bin.frequency,
  }));

  const yLabel = chart.cumulative
    ? chart.metadata?.y_axis?.label ?? "Density / Cumulative"
    : chart.metadata?.y_axis?.label ?? "Frequency";

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2">{chart.metadata.title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="range"
              label={{
                value: chart.metadata?.x_axis?.label ?? "",
                position: "insideBottomRight",
                offset: -5,
              }}
            />
            <YAxis
              label={{
                value: yLabel,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="value"
              name={chart.metadata?.y_axis?.label ?? ""}
              fill="hsl(200, 70%, 50%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
