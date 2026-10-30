const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

export const DASH = "—";

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  if (digits === 0) return integer.format(value);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  return compactFormat.format(value);
}

/** "1m 05s", "42s", "2h 10m" - for estimates, never for protocol values. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export function timeAgo(iso: string | null | undefined, now: number): string {
  if (!iso) return DASH;
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;
export const shortHash = (value: string) => `${value.slice(0, 10)}…${value.slice(-6)}`;

const UNIT = 10n ** 18n;

/** SQK base units (18 decimals) to a display string, without float rounding. */
export function formatBaseUnits(value: string | bigint | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return DASH;
  let raw: bigint;
  try {
    raw = typeof value === "bigint" ? value : /^\d+$/.test(value) ? BigInt(value) : -1n;
  } catch {
    return DASH;
  }
  if (raw < 0n) return DASH;
  const whole = integer.format(raw / UNIT);
  if (decimals === 0) return whole;
  const fraction = (raw % UNIT).toString().padStart(18, "0").slice(0, decimals);
  return `${whole}.${fraction}`;
}

/** Display-only conversion; never use the result for transactions. */
export function baseUnitsToNumber(value: string | bigint | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  try {
    const raw = typeof value === "bigint" ? value : BigInt(value);
    return Number(raw / 10n ** 12n) / 1_000_000;
  } catch {
    return null;
  }
}

export function utcHourLabel(minuteOfDay: number): string {
  return `${String(Math.floor(minuteOfDay / 60)).padStart(2, "0")}:${String(minuteOfDay % 60).padStart(2, "0")}`;
}
