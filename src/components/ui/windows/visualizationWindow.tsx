'use client';

import { useChatStore } from "@/store/useChatStore";
import type { ChartDTO } from "@/models/dto/charts";
import { LineChartView } from "@/components/charts/LineChartView";
import { AreaChartView } from "@/components/charts/AreaChartView";
import { BarChartView } from "@/components/charts/BarChartView";
import { PieChartView } from "@/components/charts/PieChartView";
import { RadarChartView } from "@/components/charts/RadarChartView";
import { ScatterChartView } from "@/components/charts/ScatterChartView";
import { HistogramChartView } from "@/components/charts/HistogramChartView";
import { WaterfallChartView } from "@/components/charts/WaterfallChartView";
import { BoxChartView } from "@/components/charts/BoxChartView";
import { useTranslation } from 'react-i18next';
import '@/i18n';

export default function VisualizationWindow() {
  const visualization = useChatStore((s) => s.visualization);
  const selectedIndex = useChatStore((s) => s.selectedChartIndex);
  const { t } = useTranslation('common');


  if (!visualization || selectedIndex === null || !visualization.charts?.length) {
    
    return(
      <div>
        <div className=" font-semibold text-primary" >{t('visualizationWindow.title')}</div>
        <div className="text-center text-muted-foreground p-4">{t('visualization.none')}</div>
      </div>
    );
  }

  const charts = visualization.charts as ChartDTO[];

  if (charts.length === 0 || selectedIndex >= charts.length) {
    return <div className="text-center text-muted-foreground p-4">{t('visualization.none')}</div>;
  }

  const chart: ChartDTO = charts[selectedIndex] as ChartDTO;

  if (chart.type === "LINE") {
    return <LineChartView chart={chart} />;
  }

  if (chart.type === 'BOX') {
    return <BoxChartView chart={chart} />;
  }

  if (chart.type === "AREA") {
    return <AreaChartView chart={chart} />;
  }

  if (chart.type === "BAR") {
    return <BarChartView chart={chart} />;
  }

  if (chart.type === "PIE") {
    return <PieChartView chart={chart} />;
  }

  if (chart.type === "RADAR") {
    return <RadarChartView chart={chart} />;
  }

  if (chart.type === "SCATTER") {
    return <ScatterChartView chart={chart} />;
  }

  if (chart.type === 'HISTOGRAM') {
    return <HistogramChartView chart={chart} />;
  }

  if (chart.type === 'WATERFALL') {
    return <WaterfallChartView chart={chart} />;
  }

  return null;
}
