/** Chart readout: the value leads, the label follows; a short line key carries identity. */
export function ChartTooltip({
  active,
  label,
  value,
  unit,
  color,
  note,
}: {
  active?: boolean;
  label?: string;
  value?: string | null;
  unit?: string;
  color: string;
  note?: string;
}) {
  if (!active) return null;
  return (
    <div className="pointer-events-none min-w-[140px] rounded-xl border border-line-strong bg-surface-3/95 px-3 py-2.5 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.8)] backdrop-blur-md">
      <div className="text-[11px] font-medium text-ink-3">{label}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="h-[3px] w-3 rounded-full" style={{ background: color }} aria-hidden="true" />
        {value ? (
          <>
            <span className="text-[15px] font-semibold tracking-tight text-ink-1 tabular">{value}</span>
            {unit ? <span className="text-xs text-ink-3">{unit}</span> : null}
          </>
        ) : (
          <span className="text-[13px] text-ink-3">Not observed</span>
        )}
      </div>
      {note ? <div className="mt-1.5 text-[11px] text-ink-3">{note}</div> : null}
    </div>
  );
}
