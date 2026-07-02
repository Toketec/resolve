import { useId } from "react";
import { cn } from "@/lib/utils";

interface Props {
  points: { t: number; yes: number }[];
  height?: number;
  width?: number;
  positive?: boolean;
  className?: string;
  invert?: boolean;
}

export function Sparkline({
  points,
  height = 56,
  width = 240,
  positive = true,
  className,
  invert = false,
}: Props) {
  const gradId = useId();
  if (!points.length) return null;
  const pad = 2;
  const xs = points.map((_, i) => (i / (points.length - 1)) * (width - pad * 2) + pad);
  const ys = points.map((p) => height - pad - p.yes * (height - pad * 2));
  const d = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ys[i].toFixed(2)}`)
    .join(" ");
  const fill =
    `${d} L ${xs[xs.length - 1].toFixed(2)} ${height} L ${xs[0].toFixed(2)} ${height} Z`;

  const stroke = positive ? "#00B14F" : "#FF2D6F";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("block", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={invert ? "0.4" : "0.28"} />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
