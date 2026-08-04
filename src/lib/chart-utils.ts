export type ChartPointValue = number | string | null;

interface DynamicCategoryTickLayoutInput {
  chartWidthPx: number;
  pointCount: number;
  rotateThresholdPx?: number;
  horizontalMinTickSpacingPx?: number;
  rotatedMinTickSpacingPx?: number;
  rotatedAngle?: number;
}

interface DynamicCategoryTickLayout {
  angle: number;
  interval: number;
  textAnchor: "middle" | "end";
  height: number;
}

function hasValueAtPoint<T extends Record<string, ChartPointValue>>(
  point: T,
  seriesNames: string[],
) {
  return seriesNames.some((seriesName) => {
    const value = point[seriesName];
    return typeof value === "number" && Number.isFinite(value) && value !== 0;
  });
}

export function trimEmptyEdgeChartPoints<T extends Record<string, ChartPointValue>>(
  points: T[],
  seriesNames: string[],
) {
  const firstNonEmptyIndex = points.findIndex((point) => hasValueAtPoint(point, seriesNames));
  if (firstNonEmptyIndex === -1) {
    return points;
  }

  let lastNonEmptyIndex = points.length - 1;
  while (lastNonEmptyIndex > firstNonEmptyIndex) {
    if (hasValueAtPoint(points[lastNonEmptyIndex], seriesNames)) {
      break;
    }

    lastNonEmptyIndex -= 1;
  }

  return points.slice(firstNonEmptyIndex, lastNonEmptyIndex + 1);
}

export function getDynamicCategoryTickLayout({
  chartWidthPx,
  pointCount,
  rotateThresholdPx = 70,
  horizontalMinTickSpacingPx = 10,
  rotatedMinTickSpacingPx = 30,
  rotatedAngle = -45,
}: DynamicCategoryTickLayoutInput): DynamicCategoryTickLayout {
  const safePointCount = Math.max(1, pointCount);
  const safeChartWidthPx = Math.max(1, chartWidthPx);
  const pixelsPerPoint = safeChartWidthPx / safePointCount;
  const angle = pixelsPerPoint < rotateThresholdPx ? rotatedAngle : 0;
  const minTickSpacingPx = angle === 0 ? horizontalMinTickSpacingPx : rotatedMinTickSpacingPx;
  const showEveryNPoints = Math.max(1, Math.ceil(minTickSpacingPx / pixelsPerPoint));

  return {
    angle,
    interval: showEveryNPoints - 1,
    textAnchor: angle === 0 ? "middle" : "end",
    height: angle === 0 ? 40 : 90,
  };
}