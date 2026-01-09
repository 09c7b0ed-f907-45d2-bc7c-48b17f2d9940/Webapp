"use client";

import {
  PieChart as RCPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PieChartDTO } from "@/models/dto/charts";

interface Props {
  chart: PieChartDTO;
}

export function PieChartView({ chart }: Props) {
  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2">{chart.metadata.title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RCPieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={chart.data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={chart.donut ? 50 : 0}
              label
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
      </div>
    </div>
  );
}
