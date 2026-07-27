import type { VisualizationResponseDTO } from "@/models/dto/response";

export type EffectiveVisualizationSelection = {
  showChart: boolean;
  showStat: boolean;
  effectiveChartIndex: number | null;
  effectiveStatIndex: number | null;
};

function isValidIndex(index: number | null, length: number): index is number {
  return index !== null && index >= 0 && index < length;
}

export function resolveEffectiveVisualizationSelection(
  visualization: VisualizationResponseDTO | null,
  selectedChartIndex: number | null,
  selectedStatIndex: number | null,
): EffectiveVisualizationSelection {
  const charts = visualization?.charts ?? [];
  const stats = visualization?.stats ?? [];

  const chartIndex = isValidIndex(selectedChartIndex, charts.length)
    ? selectedChartIndex
    : charts.length > 0
      ? 0
      : null;

  const statIndex = isValidIndex(selectedStatIndex, stats.length)
    ? selectedStatIndex
    : stats.length > 0
      ? 0
      : null;

  if (statIndex !== null) {
    return {
      showChart: false,
      showStat: true,
      effectiveChartIndex: chartIndex,
      effectiveStatIndex: statIndex,
    };
  }

  if (chartIndex !== null) {
    return {
      showChart: true,
      showStat: false,
      effectiveChartIndex: chartIndex,
      effectiveStatIndex: statIndex,
    };
  }

  return {
    showChart: false,
    showStat: false,
    effectiveChartIndex: null,
    effectiveStatIndex: null,
  };
}