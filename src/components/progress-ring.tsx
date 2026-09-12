import { MILESTONES } from "@/lib/gold/constants";
import { formatPercent } from "@/lib/gold/format";

export function ProgressRing({
  percent,
  label,
  sublabel,
}: {
  percent: number;
  label: string;
  sublabel: string;
}) {
  const size = 280;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const dash = (clamped / 100) * c;

  return (
    <div className="relative mx-auto grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-elevated)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-metal)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
        {MILESTONES.map((m) => {
          const angle = (m / 100) * 2 * Math.PI;
          const inner = r - 10;
          const outer = r + 10;
          const x1 = size / 2 + inner * Math.cos(angle);
          const y1 = size / 2 + inner * Math.sin(angle);
          const x2 = size / 2 + outer * Math.cos(angle);
          const y2 = size / 2 + outer * Math.sin(angle);
          return (
            <line
              key={m}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={clamped >= m ? "var(--color-accent)" : "var(--color-subtle)"}
              strokeWidth={2}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex rotate-0 flex-col items-center justify-center text-center">
        <p className="font-display text-4xl font-medium tracking-tight text-fg tabular-nums">
          {formatPercent(clamped)}
        </p>
        <p className="mt-1 text-sm text-muted">{label}</p>
        <p className="mt-0.5 max-w-[12rem] text-xs text-subtle">{sublabel}</p>
      </div>
    </div>
  );
}
