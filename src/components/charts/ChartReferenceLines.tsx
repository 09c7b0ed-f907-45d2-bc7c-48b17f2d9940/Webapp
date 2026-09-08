import { ReferenceLine } from "recharts";

export interface ReferenceLineConfig {
  value: number;
  label: string;
  color: string;
  strokeDasharray?: string;
}

interface Props {
  lines: ReferenceLineConfig[];
  axis?: "x" | "y";
}

export function ChartReferenceLines({
  lines,
  axis = "y",
}: Props) {
  return (
    <>
      {lines.map((line) => (
        <ReferenceLine
          key={line.label}
          {...(axis === "x" ? { x: line.value } : { y: line.value })}
          stroke={line.color}
          strokeWidth={2}
          label={{
            value: line.label + ` (${line.value})`,
            fontSize: 14,
            fontWeight: "bold",
            position: "insideTopRight" as const,
            fill: line.color,
          }}
        />

      ))}
    </>
  );
}
