import type { ChartDTO } from "./charts";

export interface StatisticalTestResultDTO {
  test_type: string;
  p_value?: number;
  effect_size?: number;
  significance_level?: number;
  passed?: boolean;
  details?: Record<string, unknown>;
  title?: string;
  description?: string;
}

export interface VisualizationResponseDTO {
  schema_version: 1;
  charts?: ChartDTO[];
  stats?: StatisticalTestResultDTO[];
  timestamp?: string; // ISO timestamp
}
