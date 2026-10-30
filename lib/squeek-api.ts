/** Read-only adapters for the published Squeekchain v1 schemas.
 * Missing, stale and unavailable values stay null; demo data is opt-in.
 * Documentation: https://docs.squeekchain.com/developers/api/
 */
import { CONTRACTS } from "./contracts.ts";

export type SeriesPoint = {
  label: string;
  date: string;
  distance: number | null;
  work: number | null;
  blocks: number | null;
};

export type ActivityItem = {
  id: string;
  block: number | null;
  work: number | null;
  reward: number | null;
  timestamp: string;
  txHash?: string;
  type?: string;
};

export type DashboardSnapshot = {
  blockHeight: number | null;
  nextBlockHeight: number | null;
  distanceTodayKm: number | null;
  speedKmh: number | null;
  progress: number | null;
  remainingSeconds: number | null;
  issuedToday: number | null;
  totalSupply: number | null;
  totalStaked: number | null;
  difficulty: number | null;
  settledWork: number | null;
  running: boolean | null;
  series: SeriesPoint[];
  typicalDay: { hour: string; work: number | null }[];
  records: { label: string; value: string }[];
  events: ActivityItem[];
  sourceStatus: "available" | "partial" | "unavailable";
  errors: string[];
  updatedAt: string | null;
  /** Wheel telemetry state: fresh ACTIVE/IDLE readings, stale, faulted or absent. */
  telemetry: Telemetry;
  /** When the latest wheel reading was received, even if it is now stale. */
  measuredAt: string | null;
  deployment: DeploymentCheck;
  sources: SourceState[];
};

export type Telemetry = "live" | "idle" | "stale" | "fault" | "unknown" | "unavailable";
export type DeploymentCheck = {
  status: "verified" | "mismatch" | "unknown";
  mismatches: { name: string; expected: string; received: string }[];
};
export type SourceState = { id: string; label: string; ok: boolean; detail: string | null };

type Json = Record<string, unknown>;
type Result = { data: Json | null; error: string | null };
const API = "https://api.squeekchain.com/v1";
const CORE = CONTRACTS.core.address.toLowerCase();
const MINING = CONTRACTS.mining.address.toLowerCase();
const TOKEN = CONTRACTS.token.address.toLowerCase();
const NFT = CONTRACTS.nft.address.toLowerCase();
const cached = new Map<string, { data: Json; etag: string | null; expires: number }>();
const cooldowns = new Map<string, { expires: number; error: string }>();
const object = (value: unknown): Json =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const list = (value: unknown): Json[] => Array.isArray(value) ? value.map(object) : [];
const string = (value: unknown): string | null => typeof value === "string" ? value : null;

/** Convert only display-safe unsigned integers. Never round a large onchain integer. */
function integer(value: unknown): number | null {
  if (typeof value === "number") return Number.isSafeInteger(value) && value >= 0 ? value : null;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = BigInt(value);
  return parsed <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(parsed) : null;
}

function scaled(value: unknown, decimals: number): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = BigInt(value);
  const scale = 10n ** BigInt(decimals);
  const whole = parsed / scale;
  if (whole > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  // Fractional precision is intentionally limited for display, not transactions.
  const fraction = Number((parsed % scale) * 1_000_000n / scale) / 1_000_000;
  return Number(whole) + fraction;
}

function validDate(value: unknown): string | null {
  // Chain envelopes sometimes encode Unix seconds as decimal strings; Date.parse
  // does not interpret these as epoch timestamps.
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return value <= 8_640_000_000_000 ? new Date(value * 1000).toISOString() : null;
  }
  const date = string(value);
  if (date && /^\d+$/.test(date)) {
    const seconds = integer(date);
    return seconds !== null && seconds <= 8_640_000_000_000 ? new Date(seconds * 1000).toISOString() : null;
  }
  return date && Number.isFinite(Date.parse(date)) ? date : null;
}

function failure(path: string, message: string, retryAfter?: string | null): Result {
  const error = `${path}: ${message}`;
  const defaultDelay = path === "/status" ? 30_000 : 60_000;
  let delay = defaultDelay;
  if (retryAfter !== null && retryAfter !== undefined) {
    const seconds = Number(retryAfter);
    const retryAt = Number.isFinite(seconds) && seconds >= 0
      ? Date.now() + seconds * 1000
      : Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) delay = Math.max(delay, retryAt - Date.now());
  }
  // Negative caching prevents every UI poll from repeating all failed requests.
  cooldowns.set(path, { expires: Date.now() + delay, error });
  return { data: null, error };
}

async function get(path: string, version: number, ttl: number, signal?: AbortSignal): Promise<Result> {
  const hit = cached.get(path);
  if (hit && hit.expires > Date.now()) return { data: hit.data, error: null };
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (hit?.etag) headers["If-None-Match"] = hit.etag;
    const response = await fetch(`${API}${path}`, { signal: controller.signal, headers, credentials: "omit" });
    if (response.status === 304 && hit) {
      hit.expires = Date.now() + ttl;
      return { data: hit.data, error: null };
    }
    if (!response.ok) {
      return failure(path, `HTTP ${response.status}`, response.headers.get("Retry-After"));
    }
    const data = object(await response.json());
    if (data.schemaVersion !== version) return failure(path, "unsupported schema version");
    if (data.status === "unavailable") return failure(path, string(data.reason) ?? "unavailable");
    const validShape = path === "/status" ? "measurement" in data && "builder" in data
      : path === "/core" ? data.status === "available" && "core" in data
      : path.startsWith("/measurement/stats") ? Array.isArray(object(data.activity).days)
      : path.startsWith("/settlements") ? data.status === "available" && Array.isArray(data.recentSettlements)
      : path === "/economy/state" ? data.status === "available" && "supply" in data
      : path.startsWith("/events") ? data.status === "available" && Array.isArray(data.events)
      : false;
    if (!validShape) return failure(path, "invalid response shape");
    const identities = object(data.identities);
    const settlementEconomy = object(object(data.mining).economy);
    const bindings: [string, unknown, string][] = [
      ["core", identities.core, CORE],
      ["core", object(data.chain).coreAddress, CORE],
      ["mining", object(identities.mining).proxy, MINING],
      ["mining", settlementEconomy.mining, MINING],
      ["token", identities.token, TOKEN],
      ["token", settlementEconomy.token, TOKEN],
      ["token", object(data.asset).address, TOKEN],
      ["NFT", identities.genesis, NFT],
    ];
    for (const [name, actual, expected] of bindings) {
      if (typeof actual === "string" && actual.toLowerCase() !== expected) {
        return failure(path, `deployment mismatch (${name}: expected ${expected}, received ${actual.toLowerCase()})`);
      }
    }
    cached.set(path, { data, etag: response.headers.get("ETag"), expires: Date.now() + ttl });
    return { data, error: null };
  } catch {
    // User cancellation is not an upstream failure and must not slow the next query.
    if (signal?.aborted) return { data: null, error: `${path}: cancelled` };
    return failure(path, controller.signal.aborted ? "request timed out" : "service unreachable");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

let previousReading: { epoch: string; work: number; at: number } | null = null;
let workRate: { perSecond: number; at: number } | null = null;
async function read(path: string, version: number, ttl: number, signal?: AbortSignal) {
  if (signal?.aborted) return { data: null, error: `${path}: cancelled` };
  const cooldown = cooldowns.get(path);
  if (cooldown && cooldown.expires > Date.now()) return { data: null, error: cooldown.error };
  cooldowns.delete(path);
  return get(path, version, ttl, signal);
}

function emptySnapshot(): DashboardSnapshot {
  return {
    blockHeight: null, nextBlockHeight: null, distanceTodayKm: null, speedKmh: null, progress: null,
    remainingSeconds: null, issuedToday: null, totalSupply: null, totalStaked: null,
    difficulty: null, settledWork: null, running: null, series: [], typicalDay: [],
    records: [], events: [], sourceStatus: "unavailable", errors: [], updatedAt: null,
    telemetry: "unavailable", measuredAt: null, deployment: { status: "unknown", mismatches: [] }, sources: [],
  };
}

const SOURCE_LABELS = [
  ["status", "Wheel telemetry"],
  ["core", "SqueekCore state"],
  ["stats", "Activity statistics"],
  ["settlements-24h", "Settlements · 24h"],
  ["settlements-range", "Settlement history"],
  ["economy", "SQK economy"],
  ["events", "Protocol events"],
] as const;
const MISMATCH = /deployment mismatch \((\w+): expected (0x[0-9a-f]{40}), received (0x[0-9a-f]{40})\)/;

/** Fetch independent views together; heavier historical reads have a 60s cache. */
export async function fetchDashboard(range: "7d" | "30d", signal?: AbortSignal): Promise<DashboardSnapshot> {
  const results = await Promise.all([
    read("/status", 1, 5_000, signal),
    read("/core", 1, 15_000, signal),
    read(`/measurement/stats?range=${range}`, 1, 60_000, signal),
    read("/settlements?range=24h", 3, 60_000, signal),
    read(`/settlements?range=${range}`, 3, 60_000, signal),
    read("/economy/state", 2, 60_000, signal),
    read("/events?category=protocol&limit=10", 3, 30_000, signal),
  ]);
  const [statusResult, coreResult, statsResult, todayResult, historyResult, economyResult, eventsResult] = results;
  const status = statusResult.data ?? {};
  const measurement = object(status.measurement);
  const builder = object(status.builder);
  const coreData = coreResult.data ?? {};
  const core = object(coreData.core);
  const anchor = builder.status === "available" ? object(builder.anchor) : {};
  const projected = builder.status === "available" ? object(builder.projected) : {};
  const stats = statsResult.data ?? {};
  const activity = object(stats.activity);
  const today = todayResult.data ?? {};
  const economy = economyResult.data ?? {};
  const result = emptySnapshot();
  result.errors = results.flatMap((entry) => entry.error ? [entry.error] : []);
  const receivedAt = validDate(measurement.receivedAt);
  const fresh = measurement.freshness === "online" && receivedAt !== null &&
    Date.now() - Date.parse(receivedAt) <= (integer(measurement.staleAfterSeconds) ?? 120) * 1000;
  if (fresh && measurement.coreStatus !== "COUNTER_FAULT") {
    const speed = integer(measurement.speedMmPerSecond);
    result.speedKmh = speed === null ? null : speed * 0.0036;
    result.running = measurement.coreStatus === "ACTIVE" ? true : measurement.coreStatus === "IDLE" ? false : null;
  } else if (statusResult.data) {
    result.errors.push("/status: measurement unavailable or stale");
  }
  result.measuredAt = receivedAt;
  result.telemetry = !statusResult.data || receivedAt === null ? "unavailable"
    : !fresh ? "stale"
    : measurement.coreStatus === "COUNTER_FAULT" ? "fault"
    : result.running === true ? "live" : result.running === false ? "idle" : "unknown";
  result.blockHeight = integer(core.blockHeight) ?? integer(anchor.blockHeight);
  result.difficulty = integer(core.workPerThousandBlocks) ?? integer(anchor.workPerThousandBlocks);
  result.settledWork = integer(core.cumulativeWork) ?? integer(anchor.cumulativeWork);
  // Progress follows the accepted, optimistic frontier, separately from settled height.
  const projectedHeight = integer(projected.blockHeight);
  result.nextBlockHeight = projectedHeight !== null && projectedHeight < Number.MAX_SAFE_INTEGER ? projectedHeight + 1 : null;
  const progress = integer(projected.blockProgress);
  result.progress = progress === null || progress >= 1_000_000_000 ? null : progress / 1_000_000_000;
  if (builder.status === "unavailable") result.errors.push(`/status: builder ${string(builder.reason) ?? "unavailable"}`);
  // ETA is an estimate from accepted work deltas, never a fabricated protocol value.
  const currentWork = integer(measurement.cumulativeWorkUnits);
  const epoch = string(measurement.counterEpoch);
  const at = receivedAt === null ? null : Date.parse(receivedAt);
  if (fresh && currentWork !== null && epoch && at !== null) {
    if (previousReading && previousReading.epoch === epoch && at > previousReading.at) {
      const elapsed = (at - previousReading.at) / 1000;
      const added = currentWork - previousReading.work;
      workRate = elapsed <= 120 && added > 0 ? { perSecond: added / elapsed, at } : null;
    } else if (previousReading && previousReading.epoch !== epoch) workRate = null;
    previousReading = { epoch, work: currentWork, at };
  }
  const projectedDifficulty = integer(projected.workPerThousandBlocks);
  if (result.running && result.nextBlockHeight !== null && result.progress !== null && projectedDifficulty !== null &&
      workRate && Date.now() - workRate.at <= 60_000) {
    result.remainingSeconds = Math.ceil((1 - result.progress) * projectedDifficulty / 1000 / workRate.perSecond);
  }
  const mining = object(today.mining);
  result.issuedToday = mining.status === "available" ? scaled(mining.rangeMintedBaseUnits, 18) : null;
  result.totalSupply = scaled(object(economy.supply).liveSupplyBaseUnits, 18);
  result.totalStaked = scaled(object(economy.staking).totalStakedBaseUnits, 18);

  // Use the accumulated statistics day with the API's explicit noon UTC boundary;
  // this history remains useful even when the instantaneous telemetry is stale.
  const currentDay = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const statsDay = list(activity.days).find((day) => day.date === currentDay);
  const observedToday = integer(object(statsDay?.coverage).observedRoundCount);
  const dayDistance = observedToday !== null && observedToday > 0 ? integer(statsDay?.distanceMm) : null;
  result.distanceTodayKm = dayDistance === null ? null : dayDistance / 1_000_000;

  const settlementBuckets = list(historyResult.data?.buckets);
  result.series = list(activity.days).flatMap((day) => {
    const date = string(day.date);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const start = Date.parse(`${date}T12:00:00.000Z`);
    const end = start + 86_400_000;
    const buckets = settlementBuckets.filter((bucket) => {
      const at = validDate(bucket.startAt);
      return at !== null && Date.parse(at) >= start && Date.parse(at) < end;
    });
    const bucketSeconds = integer(object(historyResult.data?.window).bucketSeconds);
    const blocksComplete = bucketSeconds !== null && buckets.length * bucketSeconds === 86_400 &&
      buckets.every((bucket) => integer(bucket.completedBlockCount) !== null);
    const distance = integer(day.distanceMm);
    const observed = integer(object(day.coverage).observedRoundCount);
    return [{
      date,
      label: new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      distance: distance === null ? null : distance / 1_000_000,
      work: observed !== null && observed > 0 ? integer(day.observedWorkUnits) : null,
      blocks: blocksComplete ? buckets.reduce((sum, bucket) => sum + (integer(bucket.completedBlockCount) ?? 0), 0) : null,
    }];
  });
  result.typicalDay = list(activity.typicalDay).flatMap((bucket) => {
    const minute = integer(bucket.startMinuteUtc);
    if (minute === null || minute >= 1440) return [];
    return [{ hour: `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`, work: scaled(bucket.meanWorkMilli, 3) }];
  });
  const records = object(stats.records);
  const recordSpecs: [string, string, number, string][] = [
    ["maximumDailyDistanceMm", "Longest day", 1_000_000, " km"],
    ["peakObservedSpeedMmPerSecond", "Top speed", 1 / .0036, " km/h"],
    ["longestActiveWindowMinutes", "Longest run", 1, " min"],
    ["longestActiveDayStreak", "Active streak", 1, " days"],
  ];
  result.records = recordSpecs.flatMap(([key, label, divisor, unit]) => {
    const value = integer(object(records[key]).value);
    return value === null ? [] : [{ label, value: `${(value / divisor).toLocaleString("en-US", { maximumFractionDigits: 2 })}${unit}` }];
  });

  result.events = list(eventsResult.data?.events).flatMap((event) => {
    const type = string(event.type);
    if (type !== "system.settlement_completed") return [];
    const payload = object(event.payload);
    const source = object(event.source);
    const timestamp = validDate(event.occurredAt);
    const id = string(event.id);
    if (!timestamp || !id) return [];
    // Settlement events do not carry issuance. Only the history endpoint may
    // provide SQK actually issued for this settlement's completed blocks.
    const txHash = string(source.transactionHash);
    const confirmedIssuance = list(today.recentSettlements).find((settlement) =>
      txHash !== null && settlement.transactionHash === txHash &&
      settlement.settledThroughRound === payload.settledThroughRound);
    return [{ id, block: integer(payload.blockHeight), work: integer(payload.workAdded), reward: scaled(confirmedIssuance?.sqkMintedBaseUnits, 18), timestamp, type, txHash: txHash ?? undefined }];
  });
  if (!result.events.length) {
    result.events = list(today.recentSettlements).flatMap((settlement) => {
      const timestamp = validDate(settlement.blockTimestamp);
      const txHash = string(settlement.transactionHash);
      if (!timestamp || !txHash) return [];
      return [{ id: `${txHash}:${string(settlement.logIndex) ?? "0"}`, block: integer(settlement.blockHeight), work: integer(settlement.workAdded), reward: scaled(settlement.sqkMintedBaseUnits, 18), timestamp, txHash, type: "system.settlement_completed" }];
    });
  }
  // The public API may move to a new deployment while this dashboard still
  // targets the configured contracts. Never combine that deployment's anchor
  // or telemetry projection with links and totals for the configured graph.
  if (result.errors.some((error) => error.includes("deployment mismatch"))) {
    result.blockHeight = null;
    result.nextBlockHeight = null;
    result.progress = null;
    result.remainingSeconds = null;
    result.difficulty = null;
    result.settledWork = null;
    result.issuedToday = null;
    result.totalSupply = null;
    result.totalStaked = null;
    result.events = [];
    result.series = result.series.map((point) => ({ ...point, blocks: null }));
  }
  const available = results.filter((entry) => entry.data !== null).length;
  result.sourceStatus = available === 0 ? "unavailable" : result.errors.length ? "partial" : "available";
  result.sources = results.map((entry, index) => ({
    id: SOURCE_LABELS[index][0],
    label: SOURCE_LABELS[index][1],
    ok: entry.data !== null,
    detail: entry.error === null ? null : entry.error.replace(/^\/[^ ]*: /, ""),
  }));
  const mismatches = new Map<string, DeploymentCheck["mismatches"][number]>();
  for (const error of result.errors) {
    const match = MISMATCH.exec(error);
    if (match) mismatches.set(`${match[1]}:${match[3]}`, { name: match[1], expected: match[2], received: match[3] });
  }
  // Any identity that survived get() matched the configured deployment.
  const verified = results.some(({ data }) => data !== null && [
    object(data.identities).core, object(data.chain).coreAddress,
    object(object(data.mining).economy).mining, object(data.asset).address,
  ].some((value) => typeof value === "string"));
  result.deployment = mismatches.size ? { status: "mismatch", mismatches: [...mismatches.values()] }
    : { status: verified ? "verified" : "unknown", mismatches: [] };
  // This labels the telemetry's own observation, not the user's fetch time.
  result.updatedAt = validDate(status.generatedAt) ?? validDate(stats.generatedAt) ?? validDate(today.generatedAt);
  return result;
}

/** Explicitly synthetic fixtures for the visible demo toggle. Never used as a live fallback. */
export function demoSnapshot(range: "7d" | "30d"): DashboardSnapshot {
  const now = new Date();
  const count = range === "7d" ? 7 : 30;
  const series = Array.from({ length: count }, (_, index): SeriesPoint => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - count + 1 + index);
    const distance = Math.round((7.7 + Math.sin(index * 1.9) * 2.8 + Math.cos(index * .7) * 1.1) * 100) / 100;
    return { date: date.toISOString().slice(0, 10), label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), distance, work: Math.round(distance * 1128), blocks: Math.round(distance * 103) };
  });
  return {
    blockHeight: 2847, nextBlockHeight: 2848, distanceTodayKm: 10.48, speedKmh: 4.27, progress: .734,
    remainingSeconds: 42, issuedToday: 168000, totalSupply: 9415614.06,
    totalStaked: 2840912, difficulty: 11005, settledWork: 31332, running: true,
    series,
    typicalDay: Array.from({ length: 24 }, (_, hour) => ({ hour: `${String(hour).padStart(2, "0")}:00`, work: Math.round(80 + 920 * Math.pow((1 + Math.cos((hour - 23) * Math.PI / 12)) / 2, 2)) })),
    records: [{ label: "Longest day", value: "14.82 km" }, { label: "Top speed", value: "6.24 km/h" }, { label: "Longest run", value: "96 min" }, { label: "Active streak", value: "12 days" }],
    events: Array.from({ length: 6 }, (_, index) => ({ id: `demo-${index}`, block: 2847 - index * 7, work: 77 + index * 11, reward: 5600, timestamp: new Date(now.getTime() - (index * 612 + 38) * 1000).toISOString(), type: "system.settlement_completed" })),
    sourceStatus: "available", errors: [], updatedAt: now.toISOString(),
    telemetry: "live", measuredAt: now.toISOString(), deployment: { status: "verified", mismatches: [] },
    sources: SOURCE_LABELS.map(([id, label]) => ({ id, label, ok: true, detail: null })),
  };
}
