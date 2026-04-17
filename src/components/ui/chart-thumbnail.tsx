"use client";

import type { ChartDTO } from "@/models/dto/charts";
import {
  LineChartThumbnail,
  AreaChartThumbnail,
  BarChartThumbnail,
  PieChartThumbnail,
  RadarChartThumbnail,
  ScatterChartThumbnail,
  HistogramChartThumbnail,
  WaterfallChartThumbnail,
  BoxChartThumbnail,
} from "@/components/charts/chart-thumbnail-view";

interface ChartThumbnailProps {
  chart: ChartDTO;
}

export function ChartThumbnail({ chart }: ChartThumbnailProps) {
  // Use the chart type as a key to force remount when chart type changes
  const chartKey = `${chart.type}-${JSON.stringify(chart.metadata?.title || '')}`;
  
  return (
    <div key={chartKey} style={{ width: "100%", height: "100%" }}>
      {chart.type === "LINE" && <LineChartThumbnail chart={chart} />}
      {chart.type === "BOX" && <BoxChartThumbnail chart={chart} />}
      {chart.type === "AREA" && <AreaChartThumbnail chart={chart} />}
      {chart.type === "BAR" && <BarChartThumbnail chart={chart} />}
      {chart.type === "PIE" && <PieChartThumbnail chart={chart} />}
      {chart.type === "RADAR" && <RadarChartThumbnail chart={chart} />}
      {chart.type === "SCATTER" && <ScatterChartThumbnail chart={chart} />}
      {chart.type === "HISTOGRAM" && <HistogramChartThumbnail chart={chart} />}
      {chart.type === "WATERFALL" && <WaterfallChartThumbnail chart={chart} />}
    </div>
  );
}
