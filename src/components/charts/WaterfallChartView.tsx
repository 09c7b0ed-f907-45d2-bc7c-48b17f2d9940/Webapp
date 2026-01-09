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
import type { WaterfallChartDTO } from "@/models/dto/charts";

interface Props {
  chart: WaterfallChartDTO;
}

export function WaterfallChartView({ chart }: Props) {
  let runningTotal = chart.start_value ?? 0;

  const data = chart.data.map((step) => {
    const start = runningTotal;
    const end = step.is_total ? step.value : runningTotal + step.value;
    runningTotal = end;

    return {
      label: step.label,
      start,
      end,
      value: end - start,
      isTotal: step.is_total ?? false,
    };
  });

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2">{chart.metadata.title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
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
            <Bar
              dataKey="value"
              name={chart.metadata?.y_axis?.label ?? ""}
              fill="hsl(140, 70%, 45%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
