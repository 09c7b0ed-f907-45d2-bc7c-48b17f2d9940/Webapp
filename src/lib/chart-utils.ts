export type ChartPointValue = number | string | null;

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