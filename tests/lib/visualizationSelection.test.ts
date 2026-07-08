import { describe, expect, it } from "vitest";

import { resolveEffectiveVisualizationSelection } from "@/components/ui/windows/visualizationSelection";
import type { VisualizationResponseDTO } from "@/models/dto/response";

function makeVisualization(args: {
  charts?: VisualizationResponseDTO["charts"];
  stats?: VisualizationResponseDTO["stats"];
}): VisualizationResponseDTO {
  return {
    type: "visualization_response",
    schema_version: 1,
    charts: args.charts ?? [],
    stats: args.stats ?? [],
    warnings: [],
  };
}

describe("resolveEffectiveVisualizationSelection", () => {
  it("prefers stat rendering when stats exist and no stat index is selected", () => {
    const visualization = makeVisualization({
      charts: [],
      stats: [
        {
          test_type: "MANN_WHITNEY_U_TEST",
          status: "ok",
          title: "Mann-Whitney U Test",
        },
      ],
    });

    const resolved = resolveEffectiveVisualizationSelection(visualization, null, null);

    expect(resolved.showStat).toBe(true);
    expect(resolved.showChart).toBe(false);
    expect(resolved.effectiveStatIndex).toBe(0);
  });

  it("falls back to chart when no stats are present", () => {
    const visualization = makeVisualization({
      charts: [
        {
          type: "LINE",
          data: {
            xAxis: { kind: "category", key: "x", label: "X" },
            yAxis: { kind: "value", key: "y", label: "Y" },
            series: [],
          },
        },
      ],
      stats: [],
    });

    const resolved = resolveEffectiveVisualizationSelection(visualization, null, null);

    expect(resolved.showStat).toBe(false);
    expect(resolved.showChart).toBe(true);
    expect(resolved.effectiveChartIndex).toBe(0);
  });

  it("returns no selection when visualization has neither charts nor stats", () => {
    const visualization = makeVisualization({ charts: [], stats: [] });

    const resolved = resolveEffectiveVisualizationSelection(visualization, null, null);

    expect(resolved.showStat).toBe(false);
    expect(resolved.showChart).toBe(false);
    expect(resolved.effectiveChartIndex).toBeNull();
    expect(resolved.effectiveStatIndex).toBeNull();
  });
});
