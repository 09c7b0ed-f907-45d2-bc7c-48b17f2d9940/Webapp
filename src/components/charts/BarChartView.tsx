"use client";

import {
  BarChart as RCBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { BarChartDTO } from "@/models/dto/charts";

interface Props {
  chart: BarChartDTO;
}

export function BarChartView({ chart }: Props) {
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

  const layout = (chart.orientation ?? "vertical") === "horizontal" ? "vertical" : "horizontal";

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <h3 className="text-lg font-semibold mb-2">{chart.metadata.title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RCBarChart data={data} layout={layout as any}>
            <CartesianGrid strokeDasharray="3 3" />
            {layout === "horizontal" ? (
              <>
                <XAxis
                  dataKey="bin"
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
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  label={{
                    value: chart.metadata?.y_axis?.label ?? "",
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="bin"
                  label={{
                    value: chart.metadata?.x_axis?.label ?? "",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
              </>
            )}
            <Tooltip />
            <Legend />
            {chart.series.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                fill={`hsl(${(i * 70) % 360}, 70%, 50%)`}
                stackId={chart.stacked ? "1" : undefined}
              />
            ))}
          </RCBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
