"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import { demoSnapshot, fetchDashboard, type ActivityItem, type DashboardSnapshot } from "./squeek-api";
import { PROTOCOL } from "./contracts";

export type Mode = "live" | "preview";
export type Range = "7d" | "30d";
export type Toast = { id: number; title: string; body?: string; tone: "gold" | "cyan" };

type DashboardContextValue = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  range: Range;
  setRange: (range: Range) => void;
  /** The snapshot every view renders: live data, or the labelled preview. */
  data: DashboardSnapshot | null;
  /** The latest live snapshot, kept current even while previewing. */
  live: DashboardSnapshot | null;
  connecting: boolean;
  refreshing: boolean;
  lastFetchAt: number | null;
  refresh: () => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);
const POLL_MS = 15_000;

/** Advances the sample snapshot so the preview demonstrates live behaviour. Never used in live mode. */
function advancePreview(previous: DashboardSnapshot): DashboardSnapshot {
  const now = new Date();
  const step = 0.018 + Math.random() * 0.022;
  const speed = Math.max(2.6, Math.min(5.8, (previous.speedKmh ?? 4.2) + (Math.random() - 0.5) * 0.5));
  let next: DashboardSnapshot = {
    ...previous,
    speedKmh: speed,
    distanceTodayKm: (previous.distanceTodayKm ?? 0) + speed * (2.5 / 3600),
    updatedAt: now.toISOString(),
    measuredAt: now.toISOString(),
  };
  const progress = (previous.progress ?? 0) + step;
  if (progress < 1) {
    next.progress = progress;
    next.remainingSeconds = Math.round(((1 - progress) / step) * 2.5);
    return next;
  }
  const height = (previous.nextBlockHeight ?? 2848);
  const event: ActivityItem = {
    id: `preview-${height}-${now.getTime()}`,
    block: height,
    work: 70 + Math.round(Math.random() * 40),
    reward: PROTOCOL.blockRewardSepolia,
    timestamp: now.toISOString(),
    type: "system.settlement_completed",
  };
  next = {
    ...next,
    progress: progress - 1,
    blockHeight: height,
    nextBlockHeight: height + 1,
    remainingSeconds: null,
    issuedToday: (previous.issuedToday ?? 0) + PROTOCOL.blockRewardSepolia,
    totalSupply: (previous.totalSupply ?? 0) + PROTOCOL.blockRewardSepolia,
    settledWork: (previous.settledWork ?? 0) + (event.work ?? 0),
    events: [event, ...previous.events].slice(0, 20),
  };
  return next;
}

// A shared ?preview=1 link opens the labelled sample data. Read once per page
// load so client-side navigation to URLs without the flag doesn't flip the mode.
let previewFromUrl: boolean | null = null;
const readPreviewFlag = () => (previewFromUrl ??= new URLSearchParams(window.location.search).has("preview"));
const subscribeNever = () => () => undefined;

export function DashboardProvider({ children }: { children: ReactNode }) {
  const urlPreview = useSyncExternalStore(subscribeNever, readPreviewFlag, () => false);
  const [modeOverride, setModeOverride] = useState<Mode | null>(null);
  const mode: Mode = modeOverride ?? (urlPreview ? "preview" : "live");
  const [range, setRange] = useState<Range>("7d");
  const [live, setLive] = useState<DashboardSnapshot | null>(null);
  const [preview, setPreview] = useState<DashboardSnapshot | null>(null);
  const [previewRange, setPreviewRange] = useState<Range | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [refreshing, startRefresh] = useTransition();
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const request = useRef<AbortController | null>(null);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 6_000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((current) => current.filter((item) => item.id !== id)), []);

  const refresh = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    // An async transition: `refreshing` stays true until the reads settle.
    startRefresh(async () => {
      try {
        const snapshot = await fetchDashboard(range, controller.signal);
        if (controller.signal.aborted) return;
        startRefresh(() => {
          setLive(snapshot);
          setLastFetchAt(Date.now());
          setConnecting(false);
        });
      } catch {
        /* Endpoint failures are represented inside the returned snapshot. */
        if (!controller.signal.aborted) setConnecting(false);
      }
    });
  }, [range]);

  useEffect(() => {
    refresh();
    // The adapter caches each endpoint by TTL; polling pauses in hidden tabs.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      request.current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const setMode = useCallback((next: Mode) => {
    setModeOverride(next);
    const url = new URL(window.location.href);
    if (next === "preview") url.searchParams.set("preview", "1");
    else url.searchParams.delete("preview");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  // (Re)build the sample snapshot when the preview opens or its range changes.
  if (mode === "preview" && previewRange !== range) {
    setPreviewRange(range);
    setPreview((current) => {
      const base = demoSnapshot(range);
      return current ? { ...current, series: base.series, typicalDay: base.typicalDay } : base;
    });
  }

  useEffect(() => {
    if (mode !== "preview") return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setPreview((current) => (current ? advancePreview(current) : current));
    }, 2_500);
    return () => clearInterval(id);
  }, [mode]);

  const data = mode === "preview" ? preview : live;

  // Celebrate a newly found block when the projected frontier moves forward.
  const lastBlock = useRef<{ mode: Mode; height: number | null }>({ mode, height: null });
  useEffect(() => {
    const height = data?.nextBlockHeight ?? null;
    const previous = lastBlock.current;
    if (previous.mode === mode && previous.height !== null && height !== null && height > previous.height) {
      pushToast({
        tone: "gold",
        title: `Block #${(height - 1).toLocaleString("en-US")} found`,
        body: mode === "preview"
          ? "Sample data · in live mode this follows the real wheel."
          : `${PROTOCOL.blockRewardSepolia.toLocaleString("en-US")} SQK flow to Squeek holders by active power.`,
      });
    }
    lastBlock.current = { mode, height };
  }, [data?.nextBlockHeight, mode, pushToast]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      mode,
      setMode,
      range,
      setRange,
      data,
      live,
      connecting,
      refreshing,
      lastFetchAt,
      refresh,
      toasts,
      dismissToast,
    }),
    [mode, setMode, range, data, live, connecting, refreshing, lastFetchAt, refresh, toasts, dismissToast],
  );
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return value;
}
