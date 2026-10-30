#!/usr/bin/env node
/** Reproducible, network-free adapter checks. Run with Node >=22.13:
 * node --experimental-strip-types scripts/verify-squeek-api.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const originalFetch = globalThis.fetch;
const originalNow = Date.now;
let clock = Date.parse("2026-10-29T10:00:00.000Z");
Date.now = () => clock;
const iso = () => new Date(clock).toISOString();
const pathOf = (url) => new URL(String(url)).pathname.replace(/^\/v1/, "") + new URL(String(url)).search;
const versionOf = (path) => path.startsWith("/settlements") || path.startsWith("/events") ? 3 : path.startsWith("/economy") ? 2 : 1;
const json = (value, init) => new Response(JSON.stringify(value), init);
const load = (scenario) => import(new URL(`../lib/squeek-api.ts?verify=${scenario}`, import.meta.url));

try {
  // HTTP 200 unavailable is an unknown value, not a zero balance or live demo.
  const unavailableAdapter = await load("unavailable");
  let requests = [];
  globalThis.fetch = async (url) => {
    const path = pathOf(url);
    requests.push(path);
    return json({ schemaVersion: versionOf(path), status: "unavailable", reason: "indexer_unavailable" });
  };
  const unavailable = await unavailableAdapter.fetchDashboard("7d");
  assert.equal(unavailable.sourceStatus, "unavailable");
  for (const field of ["blockHeight", "nextBlockHeight", "distanceTodayKm", "speedKmh", "progress", "remainingSeconds", "issuedToday", "totalSupply", "totalStaked", "difficulty", "settledWork", "running", "updatedAt"]) {
    assert.equal(unavailable[field], null, `${field} must remain unknown`);
  }
  assert.deepEqual(unavailable.series, []);
  assert.deepEqual(unavailable.events, []);
  assert.equal(unavailable.errors.length, 7);
  assert.equal(requests.length, 7);
  assert.equal(unavailable.telemetry, "unavailable");
  assert.equal(unavailable.measuredAt, null);
  assert.equal(unavailable.deployment.status, "unknown");
  assert.equal(unavailable.sources.length, 7);
  assert.ok(unavailable.sources.every((source) => !source.ok && source.detail === "indexer_unavailable"));
  clock += 15_000;
  await unavailableAdapter.fetchDashboard("7d");
  assert.equal(requests.length, 7, "15s UI refresh must honor failure cooldowns");
  clock += 15_000;
  await unavailableAdapter.fetchDashboard("7d");
  assert.equal(requests.length, 8, "only status retries after 30s");
  assert.equal(requests.at(-1), "/status");
  clock += 30_000;
  await unavailableAdapter.fetchDashboard("7d");
  assert.equal(requests.length, 15, "other endpoint failures retry after 60s");

  // A failed network request gets the same bounded backoff.
  const networkAdapter = await load("network");
  let failures = 0;
  globalThis.fetch = async () => { failures += 1; throw new TypeError("offline"); };
  await networkAdapter.fetchDashboard("7d");
  await networkAdapter.fetchDashboard("7d");
  assert.equal(failures, 7);

  // Retry-After accepts both seconds and the standard HTTP-date form.
  const retryAdapter = await load("retry-after");
  requests = [];
  const retryAt = new Date(clock + 120_000).toUTCString();
  globalThis.fetch = async (url) => {
    requests.push(pathOf(url));
    return json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": retryAt } });
  };
  await retryAdapter.fetchDashboard("7d");
  clock += 61_000;
  await retryAdapter.fetchDashboard("7d");
  assert.equal(requests.length, 7, "HTTP-date cooldown must survive default retry periods");
  clock += 59_000;
  await retryAdapter.fetchDashboard("7d");
  assert.equal(requests.length, 14);
  const secondsAdapter = await load("retry-seconds");
  let secondsRequests = 0;
  globalThis.fetch = async () => {
    secondsRequests += 1;
    return json({ error: "database_busy" }, { status: 503, headers: { "Retry-After": "180" } });
  };
  await secondsAdapter.fetchDashboard("7d");
  clock += 120_000;
  await secondsAdapter.fetchDashboard("7d");
  assert.equal(secondsRequests, 7);

  const adapter = await load("documented-schema");
  let statusReads = 0;
  const fixture = (path) => {
    const version = versionOf(path);
    if (path === "/status") return {
      schemaVersion: version, generatedAt: iso(),
      measurement: { freshness: "online", receivedAt: iso(), staleAfterSeconds: 120, coreStatus: "ACTIVE", speedMmPerSecond: 1000, distanceMm: 10_000_000, cumulativeWorkUnits: String(24_000 + statusReads++ * 30), counterEpoch: "fixture-epoch" },
      builder: { status: "available", anchor: { blockHeight: "2000" }, projected: { blockHeight: "2003", blockProgress: "730000000", workPerThousandBlocks: "11000" } },
    };
    if (path === "/core") return {
      schemaVersion: version, status: "available", identities: { core: "0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44" },
      core: { blockHeight: "2000", cumulativeWork: "22000", workPerThousandBlocks: "11000" },
    };
    if (path.startsWith("/measurement")) return {
      schemaVersion: version,
      activity: {
        days: [
          { date: "2026-10-27", observedWorkUnits: "0", distanceMm: null, coverage: { observedRoundCount: 0 } },
          { date: "2026-10-28", observedWorkUnits: "0", distanceMm: "1000000", coverage: { observedRoundCount: 144 } },
        ],
        typicalDay: [{ startMinuteUtc: 0, meanWorkMilli: null }, { startMinuteUtc: 30, meanWorkMilli: "12500" }],
      },
    };
    if (path.startsWith("/settlements")) return {
      schemaVersion: version, status: "available", recentSettlements: path.includes("24h") ? [{ transactionHash: `0x${"a".repeat(64)}`, settledThroughRound: "3", sqkMintedBaseUnits: "12500000000000000000" }] : [],
      mining: { status: "available", rangeMintedBaseUnits: "5600123456789000000000" },
      window: { bucketSeconds: 21600 },
      buckets: [0, 1, 2, 3].map((index) => ({ startAt: new Date(Date.parse("2026-10-28T12:00:00Z") + index * 21_600_000).toISOString(), completedBlockCount: String(index + 1) })),
    };
    if (path === "/economy/state") return { schemaVersion: version, status: "available", supply: { liveSupplyBaseUnits: "9415614066298997805843734" }, staking: null };
    return { schemaVersion: version, status: "available", events: [
      { id: "settlement", type: "system.settlement_completed", occurredAt: iso(), source: {}, payload: { blockHeight: "2000", workAdded: "120", completedBlockCount: "12" } },
      { id: "funded-settlement", type: "system.settlement_completed", occurredAt: iso(), source: { transactionHash: `0x${"a".repeat(64)}` }, payload: { blockHeight: "1990", workAdded: "100", settledThroughRound: "3" } },
      { id: "checkpoint", type: "system.mining_checkpointed", occurredAt: iso(), source: {}, payload: { amountBaseUnits: "1000000000000000000" } },
    ] };
  };
  globalThis.fetch = async (url) => json(fixture(pathOf(url)));
  const result = await adapter.fetchDashboard("7d");
  assert.equal(result.sourceStatus, "available");
  assert.equal(result.blockHeight, 2000);
  assert.equal(result.nextBlockHeight, 2004, "next block follows projected frontier, separately from settled height");
  assert.equal(result.distanceTodayKm, 1, "daily distance comes from current noon-UTC stats day, separately from live measurement");
  assert.equal(result.speedKmh, 3.6);
  assert.equal(result.progress, .73);
  assert.equal(result.issuedToday, 5600.123456);
  assert.equal(result.totalSupply, 9415614.066298);
  assert.equal(result.totalStaked, null);
  assert.equal(result.series[0].work, null, "zero coverage must remain a chart gap");
  assert.equal(result.series[0].distance, null);
  assert.equal(result.series[0].blocks, null);
  assert.equal(result.series[1].work, 0, "observed zero work is a real zero");
  assert.equal(result.series[1].distance, 1);
  assert.equal(result.series[1].blocks, 10, "only a complete noon-to-noon bucket day is summed");
  assert.equal(result.typicalDay[0].work, null);
  assert.equal(result.typicalDay[1].work, 12.5);
  assert.equal(result.remainingSeconds, null, "first reading has no measured work rate");
  assert.equal(result.events[0].reward, null, "settlement must not imply a fixed reward");
  assert.equal(result.events[1].reward, 12.5, "issued SQK is matched by settlement transaction and settled round");
  assert.equal(result.events.length, 2, "settlement table excludes separate checkpoint events");
  assert.equal(result.telemetry, "live");
  assert.equal(result.measuredAt, iso());
  assert.equal(result.deployment.status, "verified", "matching identities verify the pinned deployment");
  assert.ok(result.sources.every((source) => source.ok && source.detail === null));
  clock += 15_000;
  const next = await adapter.fetchDashboard("7d");
  assert.equal(next.remainingSeconds, 2, "ETA uses observed accepted work delta");

  // A stale reading keeps its timestamp for "last seen" copy but never reports live motion.
  const staleAdapter = await load("stale-telemetry");
  const staleAt = new Date(clock - 600_000).toISOString();
  globalThis.fetch = async (url) => {
    const path = pathOf(url);
    const data = fixture(path);
    if (path === "/status") data.measurement.receivedAt = staleAt;
    return json(data);
  };
  const stale = await staleAdapter.fetchDashboard("7d");
  assert.equal(stale.telemetry, "stale");
  assert.equal(stale.measuredAt, staleAt);
  assert.equal(stale.running, null);
  assert.equal(stale.speedKmh, null);

  // New schema versions and another deployment are rejected rather than guessed.
  for (const mode of ["schema", "deployment"]) {
    const isolated = await load(`invalid-${mode}`);
    globalThis.fetch = async (url) => {
      const path = pathOf(url);
      const data = fixture(path);
      if (mode === "schema") data.schemaVersion = 99;
      else data.identities = { core: "0x0000000000000000000000000000000000000001" };
      return json(data);
    };
    const invalid = await isolated.fetchDashboard("7d");
    assert.equal(invalid.sourceStatus, "unavailable");
    assert.equal(invalid.blockHeight, null);
    assert.equal(invalid.errors.length, 7);
  }

  // A current API can report another deployment while status still supplies a
  // projected anchor. A single mismatch must suppress every chain-specific view.
  const mismatchAdapter = await load("mixed-deployments");
  globalThis.fetch = async (url) => {
    const path = pathOf(url);
    const data = fixture(path);
    if (path === "/core" || path === "/economy/state") {
      data.identities = { core: "0x74665daeca35a2303e767e76a2ff1fb6f93e119f" };
    }
    return json(data);
  };
  const mismatch = await mismatchAdapter.fetchDashboard("7d");
  assert.equal(mismatch.sourceStatus, "partial");
  for (const field of ["blockHeight", "nextBlockHeight", "progress", "remainingSeconds", "difficulty", "settledWork", "issuedToday", "totalSupply", "totalStaked"]) {
    assert.equal(mismatch[field], null, `${field} must not fall back across deployments`);
  }
  assert.deepEqual(mismatch.events, []);
  assert.ok(mismatch.series.every((point) => point.blocks === null));
  assert.equal(mismatch.running, true, "independent wheel telemetry remains visible");
  assert.equal(mismatch.distanceTodayKm, 1, "wheel distance history remains visible");
  assert.ok(mismatch.errors.some((error) => error.includes("expected 0x980b") && error.includes("received 0x74665")));
  assert.equal(mismatch.telemetry, "live");
  assert.equal(mismatch.deployment.status, "mismatch");
  assert.deepEqual(mismatch.deployment.mismatches, [{
    name: "core",
    expected: "0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44",
    received: "0x74665daeca35a2303e767e76a2ff1fb6f93e119f",
  }], "mismatches are reported once per distinct deployment, with both addresses");
  assert.equal(mismatch.sources.find((source) => source.id === "core").ok, false);
  assert.equal(mismatch.sources.find((source) => source.id === "status").ok, true);

  // Epoch strings and numbers appear in onchain timestamp fields.
  const epochAdapter = await load("epoch-timestamps");
  globalThis.fetch = async (url) => {
    const path = pathOf(url);
    const data = fixture(path);
    const epoch = Math.floor(clock / 1000);
    if (path === "/status") {
      data.generatedAt = String(epoch);
      data.measurement.receivedAt = epoch;
    }
    if (path.startsWith("/events")) data.events = [];
    if (path.includes("/settlements?range=24h")) {
      data.recentSettlements[0].blockTimestamp = String(epoch);
      data.recentSettlements[0].blockHeight = "1990";
      data.recentSettlements[0].workAdded = "100";
    }
    return json(data);
  };
  const epochResult = await epochAdapter.fetchDashboard("7d");
  assert.equal(epochResult.running, true);
  assert.equal(epochResult.updatedAt, iso());
  assert.equal(epochResult.events[0].timestamp, iso());
  assert.equal(epochResult.events[0].reward, 12.5);

  // Optional smoke test against an actual captured API bundle; never fetches
  // network data. Example: append ../../work/live-api to the command.
  if (process.argv[2]) {
    const directory = resolve(process.argv[2]);
    const actual = Object.fromEntries(["status", "core", "stats", "settlements", "economy", "events"].map((key) => [key, JSON.parse(readFileSync(resolve(directory, `${key}.json`), "utf8"))]));
    const actualAdapter = await load("captured-live-schema");
    clock = Date.parse(actual.status.generatedAt);
    globalThis.fetch = async (url) => {
      const path = pathOf(url);
      const key = path === "/status" ? "status" : path === "/core" ? "core" : path.startsWith("/measurement") ? "stats" : path.startsWith("/settlements") ? "settlements" : path.startsWith("/economy") ? "economy" : "events";
      return json(actual[key]);
    };
    const captured = await actualAdapter.fetchDashboard("7d");
    assert.ok(captured.errors.some((error) => error.includes("deployment mismatch")));
    assert.equal(captured.blockHeight, null);
    assert.equal(captured.nextBlockHeight, null);
    assert.equal(captured.progress, null);
    assert.equal(captured.issuedToday, null);
    assert.equal(captured.totalSupply, null);
    assert.deepEqual(captured.events, []);
    assert.ok(captured.series.length > 0);
    const currentDay = new Date(clock - 43_200_000).toISOString().slice(0, 10);
    const latest = actual.stats.activity.days.find((day) => day.date === currentDay);
    assert.equal(captured.distanceTodayKm, latest?.distanceMm === null || !latest ? null : Number(latest.distanceMm) / 1e6);
    console.log("Captured API smoke test passed: current deployment mismatch suppresses chain data; independent wheel history remains available.");
  }

  const demo7 = adapter.demoSnapshot("7d");
  const demo30 = adapter.demoSnapshot("30d");
  assert.equal(demo7.series.length, 7);
  assert.equal(demo7.nextBlockHeight, 2848);
  assert.equal(demo30.series.length, 30);
  assert.equal(demo7.telemetry, "live");
  assert.equal(demo7.sources.length, 7);
  assert.ok(demo30.events.every((event) => !event.txHash), "synthetic events never impersonate chain transactions");
  assert.ok(demo30.series.every((point) => point.distance !== null && point.distance > 0));
  console.log("Squeekchain API verification passed: unavailable/null states, backoff, Retry-After, schema and deployment isolation, units, history gaps, actual issuance, measured ETA, epoch timestamps, and demos.");
} finally {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
}
