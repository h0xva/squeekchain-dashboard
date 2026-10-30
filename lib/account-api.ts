/** Read-only account adapters (schema v2): /accounts/{address}, its activity and /squeeks/{id}.
 * Balances stay unknown on any failure; nothing is guessed or defaulted to zero.
 */
import { CONTRACTS, LINKS } from "./contracts.ts";

export type Squeek = {
  tokenId: string;
  level: number;
  basePower: string;
  custody: "wallet" | "staking";
  image?: string;
  name?: string;
};

export type Account = {
  schemaVersion: number;
  status: string;
  reason?: string;
  account?: string;
  rewards?: { claimableBaseUnits: string; lifetimePaidBaseUnits: string };
  power?: { nftPower: string; sqkPower: string };
  stake?: { principalBaseUnits: string };
  earnings?: { date: string; earnedBaseUnits: string }[];
  tokens?: Squeek[];
  nextCursor?: string | null;
  tokenCounts?: { wallet: string; staking: string };
};

export type AccountActivity = {
  id: string;
  kind: string;
  amountBaseUnits?: string;
  tokenId?: string;
  source?: { transactionHash?: string; blockTimestamp?: string };
};

const EXPECTED_CORE = CONTRACTS.core.address.toLowerCase();

export const isAddress = (value: string) => /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value);
export const isUnsigned = (value: unknown): value is string => typeof value === "string" && /^\d+$/.test(value);

function validSqueek(token: Squeek) {
  return (
    token &&
    isUnsigned(token.tokenId) &&
    Number(token.tokenId) >= 1 &&
    Number(token.tokenId) <= 9999 &&
    Number.isInteger(token.level) &&
    token.level >= 1 &&
    isUnsigned(token.basePower) &&
    (token.custody === "wallet" || token.custody === "staking")
  );
}

export function validateAccount(data: Account) {
  if (
    !Array.isArray(data.tokens) ||
    !data.tokens.every(validSqueek) ||
    !isUnsigned(data.power?.nftPower) ||
    !isUnsigned(data.power?.sqkPower) ||
    !isUnsigned(data.rewards?.claimableBaseUnits) ||
    (data.earnings !== undefined &&
      (!Array.isArray(data.earnings) ||
        !data.earnings.every((day) => day && typeof day.date === "string" && isUnsigned(day.earnedBaseUnits))))
  ) {
    throw new Error("The account response is incomplete. Balances are currently unknown.");
  }
}

export function imageUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (
    raw.startsWith("https://") ||
    raw.startsWith("data:image/svg+xml") ||
    raw.startsWith("data:image/png") ||
    raw.startsWith("data:image/webp")
  ) {
    return raw;
  }
  if (raw.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${raw.slice(7)}`;
  return undefined;
}

export async function readAccountApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(cancel, 10_000);
  try {
    const response = await fetch(`${LINKS.apiBase}${path}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
    });
    if (!response.ok) {
      throw new Error(
        response.status === 429
          ? "The API is busy. Please try again shortly."
          : response.status === 409
            ? "The account page changed. Retry to refresh this portfolio."
            : `Data request failed (HTTP ${response.status}).`,
      );
    }
    const decoded: unknown = await response.json();
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      throw new Error("The API returned an incomplete response.");
    }
    const body = decoded as Record<string, unknown>;
    const identities = body.identities;
    if (identities && typeof identities === "object" && !Array.isArray(identities)) {
      const core = (identities as Record<string, unknown>).core;
      if (typeof core === "string" && core.toLowerCase() !== EXPECTED_CORE) {
        throw new Error("The API reports a different deployment than the pinned contracts. Portfolio data is withheld.");
      }
    }
    if (body.schemaVersion !== 2) throw new Error("This API response version is not supported yet.");
    if (body.status === "unavailable") {
      throw new Error(`Account data is unavailable${body.reason ? `: ${String(body.reason).replaceAll("_", " ")}` : ""}.`);
    }
    if (body.status !== "available") throw new Error("The API returned an incomplete response.");
    return body as T;
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The API did not respond. Balances are currently unknown.");
    }
    if (error instanceof TypeError) throw new Error("The Squeekchain API cannot be reached. Balances are currently unknown.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

/** Metadata is optional; a missing image must never hide an owned Squeek. */
export async function enrichSqueeks(entries: Squeek[], signal: AbortSignal): Promise<Squeek[]> {
  const enriched: Squeek[] = [];
  for (let index = 0; index < entries.length && !signal.aborted; index += 5) {
    const batch = await Promise.all(
      entries.slice(index, index + 5).map(async (token) => {
        try {
          const detail = await readAccountApi<{
            metadata?: { cardImageUrl?: string; imageDataUri?: string; name?: string };
          }>(`/squeeks/${token.tokenId}`, signal);
          return {
            ...token,
            image: imageUrl(detail.metadata?.cardImageUrl) ?? imageUrl(detail.metadata?.imageDataUri),
            name: typeof detail.metadata?.name === "string" ? detail.metadata.name : undefined,
          };
        } catch {
          return token;
        }
      }),
    );
    enriched.push(...batch);
  }
  return enriched;
}

/** Explicit sample portfolio for the preview mode. Never shown as a real balance. */
export const demoSqueeks: Squeek[] = [
  { tokenId: "1024", level: 4, basePower: "160", custody: "staking" },
  { tokenId: "6900", level: 3, basePower: "80", custody: "staking" },
  { tokenId: "4218", level: 2, basePower: "40", custody: "wallet" },
];

export const demoAccount: Account = {
  schemaVersion: 2,
  status: "available",
  rewards: { claimableBaseUnits: "12480500000000000000000", lifetimePaidBaseUnits: "98432000000000000000000" },
  power: { nftPower: "240", sqkPower: "68" },
  stake: { principalBaseUnits: "42500000000000000000000" },
  earnings: Array.from({ length: 7 }, (_, index) => ({
    date: `2026-10-${22 + index}`,
    earnedBaseUnits: `${1600 + Math.round(Math.sin(index * 1.3) * 180) + index * 44}000000000000000000`,
  })),
  tokens: demoSqueeks,
  tokenCounts: { staking: "2", wallet: "1" },
};

export const demoActivity: AccountActivity[] = [
  { id: "demo1", kind: "rewards_claimed", amountBaseUnits: "6900000000000000000000" },
  { id: "demo2", kind: "nft_deposited", tokenId: "1024" },
  { id: "demo3", kind: "sqk_staked", amountBaseUnits: "12500000000000000000000" },
];
