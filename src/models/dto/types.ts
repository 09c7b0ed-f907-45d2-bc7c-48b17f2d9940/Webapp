export type ChartType =
  | "LINE"
  | "BAR"
  | "BOX"
  | "HISTOGRAM"
  | "SCATTER"
  | "PIE"
  | "RADAR"
  | "WATERFALL"
  | "AREA";

export interface ChartPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartPoint[];
  color?: string;
  style?: Record<string, unknown>;
}

export type AxisType = "linear" | "logarithmic" | "category" | "time";

export interface ChartAxis {
  label: string;
  type?: AxisType;
  min_value?: number;
  max_value?: number;
  unit?: string;
}

export interface ChartMetadata {
  title: string;
  description?: string;
  x_axis?: ChartAxis;
  y_axis?: ChartAxis;
  legend?: boolean;
  width?: number;
  height?: number;
}
