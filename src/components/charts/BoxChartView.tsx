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
  ErrorBar,
} from "recharts";
import type { BoxChartDTO } from "@/models/dto/charts";

interface Props {
  chart: BoxChartDTO;
}

export function BoxChartView({ chart }: Props) {
  const data = chart.data.map((entry) => ({
    name: entry.name,
    q1: entry.q1,
    median: entry.median,
    q3: entry.q3,
    min: entry.min,
    max: entry.max,
  }));

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2">{chart.metadata.title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
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
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="median" name="Median" fill="hsl(220, 70%, 50%)">
              <ErrorBar dataKey="q1" direction="y" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
