"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  enrichSqueeks,
  readAccountApi,
  validateAccount,
  type Account,
  type AccountActivity,
  type Squeek,
} from "@/lib/account-api";

type State = {
  account: Account | null;
  squeeks: Squeek[];
  activity: AccountActivity[];
  activityError: boolean;
  cursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
};

const EMPTY: State = {
  account: null,
  squeeks: [],
  activity: [],
  activityError: false,
  cursor: null,
  loading: false,
  loadingMore: false,
  error: null,
};

/** Loads one address's portfolio; switching address cancels the previous reads. */
export function useAccount(address: string | null) {
  const [state, setState] = useState<State>(EMPTY);
  const [attempt, setAttempt] = useState(0);
  const active = useRef<AbortController | null>(null);
  const current = useRef(address);

  useEffect(() => {
    current.current = address;
    active.current?.abort();
    if (!address) {
      setState(EMPTY);
      return;
    }
    const abort = new AbortController();
    active.current = abort;
    setState({ ...EMPTY, loading: true });
    void (async () => {
      try {
        const data = await readAccountApi<Account>(`/accounts/${address}?limit=12`, abort.signal);
        if (abort.signal.aborted) return;
        validateAccount(data);
        setState((previous) => ({
          ...previous,
          account: data,
          squeeks: data.tokens ?? [],
          cursor: typeof data.nextCursor === "string" ? data.nextCursor : null,
          loading: false,
        }));
        const enriched = await enrichSqueeks(data.tokens ?? [], abort.signal);
        if (!abort.signal.aborted) setState((previous) => ({ ...previous, squeeks: enriched }));
      } catch (error) {
        if (!abort.signal.aborted) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error: error instanceof Error ? error.message : "Account data is unavailable.",
          }));
        }
      }
    })();
    void readAccountApi<{ activity: AccountActivity[] }>(`/accounts/${address}/activity?limit=5`, abort.signal)
      .then((data) => {
        if (!Array.isArray(data.activity) || !data.activity.every((item) => item && typeof item.id === "string" && typeof item.kind === "string")) {
          throw new Error("Activity response is incomplete.");
        }
        if (!abort.signal.aborted) setState((previous) => ({ ...previous, activity: data.activity }));
      })
      .catch(() => {
        if (!abort.signal.aborted) setState((previous) => ({ ...previous, activityError: true }));
      });
    return () => abort.abort();
  }, [address, attempt]);

  const loadMore = useCallback(async () => {
    const selected = address;
    const abort = active.current;
    if (!selected || !state.cursor || state.loadingMore || !abort) return;
    setState((previous) => ({ ...previous, loadingMore: true }));
    try {
      const page = await readAccountApi<Account>(
        `/accounts/${selected}?limit=12&cursor=${encodeURIComponent(state.cursor)}`,
        abort.signal,
      );
      if (current.current !== selected || abort.signal.aborted) return;
      validateAccount(page);
      const entries = page.tokens ?? [];
      setState((previous) => ({
        ...previous,
        squeeks: [...previous.squeeks, ...entries.filter((next) => !previous.squeeks.some((token) => token.tokenId === next.tokenId))],
        cursor: typeof page.nextCursor === "string" ? page.nextCursor : null,
      }));
      const enriched = await enrichSqueeks(entries, abort.signal);
      if (current.current === selected && !abort.signal.aborted) {
        setState((previous) => ({
          ...previous,
          squeeks: previous.squeeks.map((token) => enriched.find((item) => item.tokenId === token.tokenId) ?? token),
        }));
      }
    } catch (error) {
      if (current.current === selected && !abort.signal.aborted) {
        setState((previous) => ({ ...previous, error: error instanceof Error ? error.message : "Unable to load more Squeeks." }));
      }
    } finally {
      if (current.current === selected) setState((previous) => ({ ...previous, loadingMore: false }));
    }
  }, [address, state.cursor, state.loadingMore]);

  return { ...state, loadMore, retry: () => setAttempt((value) => value + 1) };
}
