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
  AreaChart as RCAreaChart,
  Area,
  BarChart as RCBarChart,
  Bar,
  PieChart as RCPieChart,
  Pie,
  Cell,
  RadarChart as RCRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { ChartDTO, LineChartDTO, AreaChartDTO, BarChartDTO, PieChartDTO, RadarChartDTO, BoxChartDTO } from "@/models/dto/charts";
import { useTranslation } from 'react-i18next';
import '@/i18n';

export default function VisualizationWindow() {
  const visualization = useChatStore((s) => s.visualization);
  const selectedIndex = useChatStore((s) => s.selectedChartIndex);
  const { t } = useTranslation('common');

  if (!visualization || selectedIndex === null || !visualization.charts?.length) {
    return <div className="text-center text-muted-foreground p-4">{t('visualization.none')}</div>;
  }

  const charts = visualization.charts as ChartDTO[];

  if (charts.length === 0 || selectedIndex >= charts.length) {
    return <div className="text-center text-muted-foreground p-4">{t('visualization.none')}</div>;
  }

  const chart = charts[selectedIndex] as ChartDTO;

  if (chart.type === 'LINE') {
    const lineChart = chart as LineChartDTO;
    // Build bins from x across series
    const bins: (string | number)[] = [];
    const seen = new Set<string>();
    lineChart.series.forEach((s) => s.data.forEach((p) => { const k = String(p.x); if (!seen.has(k)) { seen.add(k); bins.push(p.x); } }));
    const data = bins.map((bin) => {
      const point: Record<string, any> = { bin };
      lineChart.series.forEach((s) => {
        const val = s.data.find((p) => String(p.x) === String(bin))?.y;
        point[s.name] = val ?? NaN;
      });
      return point;
    });

    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{lineChart.metadata.title}</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" label={{ value: lineChart.metadata?.x_axis?.label ?? '', position: "insideBottomRight", offset: -5 }} />
              <YAxis label={{ value: lineChart.metadata?.y_axis?.label ?? '', angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              {lineChart.series.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
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

  // Legacy branches removed; DTO branches are below

  if (chart.type === 'BOX') {
    const boxChart = chart as BoxChartDTO;
    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{boxChart.metadata.title}</h3>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <span className="text-muted-foreground">{t('visualization.boxNotImplemented')}</span>
        </div>
      </div>
    );
  }

  if (chart.type === 'AREA') {
    const area = chart as AreaChartDTO;
    const bins: (string | number)[] = [];
    const seen = new Set<string>();
    area.series.forEach((s) => s.data.forEach((p) => { const k = String(p.x); if (!seen.has(k)) { seen.add(k); bins.push(p.x); } }));
    const data = bins.map((bin) => {
      const point: Record<string, any> = { bin };
      area.series.forEach((s) => {
        const val = s.data.find((p) => String(p.x) === String(bin))?.y;
        point[s.name] = val ?? NaN;
      });
      return point;
    });

    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{area.metadata.title}</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RCAreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" label={{ value: area.metadata?.x_axis?.label ?? '', position: "insideBottomRight", offset: -5 }} />
              <YAxis label={{ value: area.metadata?.y_axis?.label ?? '', angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              {area.series.map((s, i) => (
                <Area
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={`hsl(${(i * 70) % 360}, 70%, 50%)`}
                  fill={`hsl(${(i * 70) % 360}, 70%, 50%)`}
                  fillOpacity={0.25}
                  stackId={area.stacked ? "1" : undefined}
                />
              ))}
            </RCAreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (chart.type === 'BAR') {
    const bar = chart as BarChartDTO;
    const bins: (string | number)[] = [];
    const seen = new Set<string>();
    bar.series.forEach((s) => s.data.forEach((p) => { const k = String(p.x); if (!seen.has(k)) { seen.add(k); bins.push(p.x); } }));
    const data = bins.map((bin) => {
      const point: Record<string, any> = { bin };
      bar.series.forEach((s) => {
        const val = s.data.find((p) => String(p.x) === String(bin))?.y;
        point[s.name] = val ?? NaN;
      });
      return point;
    });

    const layout = (bar.orientation ?? 'vertical') === 'horizontal' ? 'vertical' : 'horizontal';

    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{bar.metadata.title}</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RCBarChart data={data} layout={layout as any}>
              <CartesianGrid strokeDasharray="3 3" />
              {layout === 'horizontal' ? (
                <>
                  <XAxis dataKey="bin" label={{ value: bar.metadata?.x_axis?.label ?? '', position: "insideBottomRight", offset: -5 }} />
                  <YAxis label={{ value: bar.metadata?.y_axis?.label ?? '', angle: -90, position: "insideLeft" }} />
                </>
              ) : (
                <>
                  <XAxis type="number" label={{ value: bar.metadata?.y_axis?.label ?? '', position: "insideBottomRight", offset: -5 }} />
                  <YAxis type="category" dataKey="bin" label={{ value: bar.metadata?.x_axis?.label ?? '', angle: -90, position: "insideLeft" }} />
                </>
              )}
              <Tooltip />
              <Legend />
              {bar.series.map((s, i) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  fill={`hsl(${(i * 70) % 360}, 70%, 50%)`}
                  stackId={bar.stacked ? "1" : undefined}
                />
              ))}
            </RCBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (chart.type === 'PIE') {
    const pie = chart as PieChartDTO;
    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{pie.metadata.title}</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RCPieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={pie.data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={pie.donut ? 50 : 0}
                label
              >
                {pie.data.map((s, i) => (
                  <Cell key={`slice-${i}`} fill={s.color || `hsl(${(i * 70) % 360}, 70%, 50%)`} />
                ))}
              </Pie>
            </RCPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (chart.type === 'RADAR') {
    const radar = chart as RadarChartDTO;
    const data = radar.axes.map((axis, i) => {
      const point: Record<string, any> = { axis };
      radar.series.forEach((s) => {
        const val = s.data.find((p) => String(p.x) === String(axis))?.y;
        point[s.name] = val ?? NaN;
      });
      return point;
    });

    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{radar.metadata.title}</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RCRadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" />
              <PolarRadiusAxis />
              <Legend />
              <Tooltip />
              {radar.series.map((s, i) => (
                <Radar key={s.name} name={s.name} dataKey={s.name} stroke={`hsl(${(i * 70) % 360}, 70%, 50%)`} fill={`hsl(${(i * 70) % 360}, 70%, 50%)`} fillOpacity={0.3} />
              ))}
            </RCRadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Placeholders for not-yet-implemented types
  if (chart.type === 'SCATTER') {
    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{(chart as any).metadata?.title ?? ''}</h3>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <span className="text-muted-foreground">{t('visualization.notImplemented')}</span>
        </div>
      </div>
    );
  }

  if (chart.type === 'HISTOGRAM') {
    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{(chart as any).metadata?.title ?? ''}</h3>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <span className="text-muted-foreground">{t('visualization.notImplemented')}</span>
        </div>
      </div>
    );
  }

  if (chart.type === 'WATERFALL') {
    return (
      <div className="h-full w-full flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{(chart as any).metadata?.title ?? ''}</h3>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <span className="text-muted-foreground">{t('visualization.notImplemented')}</span>
        </div>
      </div>
    );
  }

  return null;
}
