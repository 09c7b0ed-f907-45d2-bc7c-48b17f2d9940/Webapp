"use client";

import {
  BarChart as RCBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { BarChartDTO } from "@/models/dto/charts";
import { getDynamicCategoryTickLayout, getSeriesColor } from "@/lib/chart-utils";
import { ChartReferenceLines } from "./ChartReferenceLines";
import { AngelsWingIcon } from "@/components/ui/icons/angels-wing-icon";
import { useElementWidth } from "@/hooks/use-element-width";

interface Props {
  chart: BarChartDTO;
  showReferenceLines?: boolean;
  onToggleReferenceLines?: (show: boolean) => void;
}

function formatNumericBinValue(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function buildBinLabel(
  bin: string | number,
  index: number,
  bins: (string | number)[],
  preferredLabel?: string,
) {
  if (preferredLabel) {
    return preferredLabel;
  }

  if (typeof bin === "number") {
    const nextBin = bins[index + 1];
    if (typeof nextBin === "number") {
      return `${formatNumericBinValue(bin)}-${formatNumericBinValue(nextBin)}`;
    }

    const previousBin = bins[index - 1];
    if (typeof previousBin === "number") {
      const step = bin - previousBin;
      return `${formatNumericBinValue(bin)}-${formatNumericBinValue(bin + step)}`;
    }
  }

  return String(bin);
}

export function BarChartView({ chart, showReferenceLines = true, onToggleReferenceLines }: Props) {
  const { elementRef: chartContainerRef, widthPx: chartWidthPx } = useElementWidth<HTMLDivElement>(1000);
  const seriesNames = chart.series.map((series) => series.name);
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

  const binLabels = new Map<string, string>();
  chart.series.forEach((series) => {
    series.data.forEach((entry) => {
      if (!entry.label) {
        return;
      }

      const key = String(entry.x);
      if (!binLabels.has(key)) {
        binLabels.set(key, entry.label);
      }
    });
  });

  const data = bins.map((bin, index) => {
    const point: Record<string, number | string> = {
      bin,
      binLabel: buildBinLabel(bin, index, bins, binLabels.get(String(bin))),
    };
    chart.series.forEach((s) => {
      const val = s.data.find((p) => String(p.x) === String(bin))?.y ?? NaN;
      point[s.name] = val;
    });
    return point;
  });
  const tickLayout = getDynamicCategoryTickLayout({
    chartWidthPx: chartWidthPx,
    pointCount: data.length,
    rotateThresholdPx: 70,
    horizontalMinTickSpacingPx: 10,
    rotatedMinTickSpacingPx: 30,
    rotatedAngle: -45,
    labelHeightBig: 70,
    labelHeightSmall: 50,
  });

  const layout: "horizontal" | "vertical" =
    (chart.orientation ?? "vertical") === "horizontal" ? "vertical" : "horizontal";

  const referenceLines = [
    { value: 20, label: "Gold", color: "var(--aa-gold)" },
    { value: 40, label: "Diamond", color: "var(--aa-diamond)" },
    { value: 30, label: "Platinum", color: "var(--aa-platinum)" },
  ];

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-primary">{chart.metadata.title}</h3>
        {onToggleReferenceLines && (
          <button
            onClick={() => onToggleReferenceLines(!showReferenceLines)}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded border border-border hover:bg-accent transition-colors"
            title={showReferenceLines ? "Hide reference lines" : "Show reference lines"}
            aria-label={showReferenceLines ? "Hide reference lines" : "Show reference lines"}
          >
            <span>{showReferenceLines ? "Hide" : "Show"} Angels Awards</span>
            <AngelsWingIcon className="h-5 w-5 object-contain" />
          </button>
        )}
      </div>
      <div ref={chartContainerRef} className="flex-1 min-h-0">
          <RCBarChart data={data} layout={layout} responsive={true} style={{ width: '100%', height: '100%' }}>
            <CartesianGrid strokeDasharray="3 3" />
            {layout === "horizontal" ? (
              <>
                <XAxis
                  height={tickLayout.height}
                  angle={tickLayout.angle}
                  textAnchor={tickLayout.textAnchor}
                  interval={tickLayout.interval}
                  dataKey="binLabel"
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
                    position: "center",
                    dx: -20,
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
                  dataKey="binLabel"
                  label={{
                    value: chart.metadata?.x_axis?.label ?? "",
                    angle: -90,
                    position: "center",
                    dx: -20,
                  }}
                />
              </>
            )}
            <Tooltip 
              cursor={{ fill: "oklch(from var(--foreground) l c h / 0.35)" }} 
              animationEasing="spring" 
              contentStyle={{ backgroundColor: "var(--card)", borderRadius: "var(--radius)",  minWidth: "100px", fontSize: "0.75rem", fontWeight: "bold" }}
            />
            {showReferenceLines && <ChartReferenceLines lines={referenceLines} />}
            <Legend />
            {chart.series.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                fill={getSeriesColor(i)}
                stackId={chart.stacked ? "1" : undefined}
                isAnimationActive={false}
              />
            ))}
          </RCBarChart>
      </div>
    </div>
  );
}
