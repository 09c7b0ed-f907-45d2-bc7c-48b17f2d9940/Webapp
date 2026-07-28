import { promises as fs } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { CHART_TYPES } from "@/models/dto/types";

type SsotEntry = {
  canonical?: string;
};

describe("CHART_TYPES", () => {
  it("matches SSOT/ChartType.yml's canonical values exactly", async () => {
    const filePath = path.join(process.cwd(), "src", "shared", "SSOT", "ChartType.yml");
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = YAML.parse(content) as SsotEntry[];

    const ssotCanonicals = parsed
      .map((entry) => entry.canonical)
      .filter((value): value is string => typeof value === "string")
      .sort();

    const chartTypes = [...CHART_TYPES].sort();

    expect(chartTypes).toEqual(ssotCanonicals);
  });
});
