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
import type { PlotCollection, LinePlot, BoxPlot } from "@/models/chartModels";
import { useTranslation } from 'react-i18next';
import '@/i18n';

export default function VisualizationWindow() {
  const visualization = useChatStore((s) => s.visualization);
  const selectedIndex = useChatStore((s) => s.selectedChartIndex);
  const { t } = useTranslation('common');

  if (!visualization || selectedIndex === null) {
    return <div className="text-center text-muted-foreground p-4">{t('visualization.none')}</div>;
  }

  const charts: ({ type: 'line', chart: LinePlot } | { type: 'box', chart: BoxPlot })[] = [
    ...(visualization.linePlots?.map((chart) => ({ type: 'line' as const, chart })) ?? []),
    ...(visualization.boxPlots?.map((chart) => ({ type: 'box' as const, chart })) ?? []),
  ];

  if (charts.length === 0 || selectedIndex >= charts.length) {
    return <div className="text-center text-muted-foreground p-4">{t('visualization.none')}</div>;
  }

  const { type, chart } = charts[selectedIndex];

  if (type === 'line') {
    const lineChart = chart as LinePlot;
    const data = lineChart.bins.map((bin, i) => {
      const point: Record<string, number> = { bin } as any;
      lineChart.series.forEach((s) => {
        point[s.label] = s.values[i];
      });
      return point;
    });

    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{lineChart.chartTitle}</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" label={{ value: lineChart.xAxisLabel, position: "insideBottomRight", offset: -5 }} />
              <YAxis label={{ value: lineChart.yAxisLabel, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              {lineChart.series.map((s, i) => (
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

  if (type === 'box') {
    const boxChart = chart as BoxPlot;
    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{boxChart.chartTitle}</h3>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <span className="text-muted-foreground">{t('visualization.boxNotImplemented')}</span>
        </div>
      </div>
    );
  }

  return null;
}
