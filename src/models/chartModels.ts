export interface BoxPlotSeries {
    label: string;
    min?: number;
    q1: number;
    median: number;
    q3: number;
    max?: number;
    mean?: number;
    ci_mean?: number[] | null;
    ci_median?: number[] | null;
}

export interface BoxPlot {
    chartTitle: string;
    yAxisLabel: string;
    series: BoxPlotSeries[];
    sourceMetricId?: string | null;
}

export interface LinePlotSeries {
    label: string;
    values: number[];
}

export interface LinePlot {
    chartTitle: string;
    xAxisLabel: string;
    yAxisLabel: string;
    bins: number[];
    series: LinePlotSeries[];
    grouped?: boolean; // default true in Python, but TS interfaces can't enforce default
    sourceMetricId?: string | null;
}

export interface PlotCollection {
    linePlots?: LinePlot[];
    boxPlots?: BoxPlot[];
}