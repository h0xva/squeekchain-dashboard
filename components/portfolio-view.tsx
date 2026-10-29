"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, ChevronRight, CircleAlert, Coins, Copy, ExternalLink, LoaderCircle, LogOut, Search, ShieldCheck, Wallet, Zap } from "lucide-react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};
type Token = { tokenId: string; level: number; basePower: string; custody: "wallet" | "staking"; image?: string; name?: string };
type Account = {
  schemaVersion: number; status: string; reason?: string; account?: string;
  rewards?: { claimableBaseUnits: string; lifetimePaidBaseUnits: string };
  power?: { nftPower: string; sqkPower: string };
  stake?: { principalBaseUnits: string };
  earnings?: { date: string; earnedBaseUnits: string }[];
  tokens?: Token[]; nextCursor?: string | null;
  tokenCounts?: { wallet: string; staking: string };
};
type AccountActivity = { id: string; kind: string; amountBaseUnits?: string; tokenId?: string; source?: { transactionHash?: string; blockTimestamp?: string } };
const API = "https://api.squeekchain.com/v1";
const EXPECTED_CORE = "0x74665dAecA35A2303e767E76a2FF1FB6F93e119f".toLowerCase();
const UNIT = BigInt("1000000000000000000");
const ZERO = BigInt(0);
const demoTokens: Token[] = [
  { tokenId: "1024", level: 4, basePower: "160", custody: "staking" },
  { tokenId: "6900", level: 3, basePower: "80", custody: "staking" },
  { tokenId: "4218", level: 2, basePower: "40", custody: "wallet" },
];
const demo: Account = { schemaVersion: 2, status: "available", rewards: { claimableBaseUnits: "12480500000000000000000", lifetimePaidBaseUnits: "98432000000000000000000" }, power: { nftPower: "240", sqkPower: "68" }, stake: { principalBaseUnits: "42500000000000000000000" }, earnings: Array.from({ length: 7 }, (_, i) => ({ date: `2026-10-${22 + i}`, earnedBaseUnits: `${1600 + i * 44}000000000000000000` })), tokens: demoTokens, tokenCounts: { staking: "2", wallet: "1" } };
const demoActivity: AccountActivity[] = [ { id: "demo1", kind: "rewards_claimed", amountBaseUnits: "6900000000000000000000" }, { id: "demo2", kind: "nft_deposited", tokenId: "1024" }, { id: "demo3", kind: "sqk_staked", amountBaseUnits: "12500000000000000000000" } ];

// Preserve base-unit precision; only format to decimal strings for display.
function safeInteger(value?: string): bigint { try { return value && /^\d+$/.test(value) ? BigInt(value) : ZERO; } catch { return ZERO; } }
function amount(value?: string, decimals = 2): string {
  if (value === undefined || !/^\d+$/.test(value)) return "—";
  const raw = safeInteger(value); const whole = (raw / UNIT).toLocaleString("en-US");
  const fraction = (raw % UNIT).toString().padStart(18, "0").slice(0, decimals);
  return decimals ? `${whole}.${fraction}` : whole;
}
function shortAddress(value: string) { return `${value.slice(0, 6)}…${value.slice(-4)}`; }
function validAddress(value: string) { return /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value); }
function unsigned(value: unknown): value is string { return typeof value === "string" && /^\d+$/.test(value); }
function validToken(token: Token) { return token && unsigned(token.tokenId) && Number(token.tokenId) >= 1 && Number(token.tokenId) <= 9999 && Number.isInteger(token.level) && token.level >= 1 && unsigned(token.basePower) && (token.custody === "wallet" || token.custody === "staking"); }
function validateAccount(data: Account) {
  if (!Array.isArray(data.tokens) || !data.tokens.every(validToken) || !unsigned(data.power?.nftPower) || !unsigned(data.power?.sqkPower) || !unsigned(data.rewards?.claimableBaseUnits) || (data.earnings !== undefined && (!Array.isArray(data.earnings) || !data.earnings.every(day => day && typeof day.date === "string" && unsigned(day.earnedBaseUnits))))) throw new Error("The account response is incomplete. Balances are currently unknown.");
}
function getProvider() { return (window as unknown as { ethereum?: EthereumProvider }).ethereum; }
function imageUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("https://") || raw.startsWith("data:image/svg+xml") || raw.startsWith("data:image/png") || raw.startsWith("data:image/webp")) return raw;
  if (raw.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${raw.slice(7)}`;
  return undefined;
}
function TokenPortrait({ token }: { token: Token }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [token.image]);
  return token.image && !failed ? <img src={token.image} alt={token.name ?? `Squeek #${token.tokenId}`} onError={() => setFailed(true)}/> : <div className="portfolio-image-pending"><Wallet size={32} aria-hidden="true"/><span>Image unavailable</span></div>;
}
async function readApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort(); signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(cancel, 10000);
  try {
    const response = await fetch(`${API}${path}`, { signal: controller.signal, headers: { accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 429 ? "The API is busy. Please try again shortly." : response.status === 409 ? "The account page changed. Retry to refresh your portfolio." : `Data request failed (${response.status}).`);
    const decoded: unknown = await response.json();
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) throw new Error("The API returned an incomplete response.");
    const body = decoded as Record<string, unknown>;
    const identities = body.identities;
    if (identities && typeof identities === "object" && !Array.isArray(identities)) {
      const core = (identities as Record<string, unknown>).core;
      if (typeof core === "string" && core.toLowerCase() !== EXPECTED_CORE) throw new Error("API deployment differs from the configured contracts. Portfolio data is withheld.");
    }
    if (body.schemaVersion !== 2) throw new Error("This API response version is not supported yet.");
    if (body.status === "unavailable") throw new Error(`Account data is unavailable${body.reason ? `: ${String(body.reason).replaceAll("_", " ")}` : ""}.`);
    if (body.status !== "available") throw new Error("The API returned an incomplete response.");
    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("The API did not respond. Your balances are currently unknown.");
    if (error instanceof TypeError) throw new Error("The Squeekchain API cannot be reached. Your balances are currently unknown.");
    throw error;
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", cancel); }
}

function HamsterPortrait({ index }: { index: number }) {
  const palettes = [["#232c4a", "#528fff", "#cda26f"], ["#322b25", "#eebf64", "#d5b98e"], ["#29382f", "#8dc5a0", "#bd9b81"]];
  const [background, accent, fur] = palettes[index % 3];
  return <svg viewBox="0 0 320 220" aria-label="Illustrative demo Squeek portrait" role="img"><defs><pattern id={`portfolioGrid${index}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke={accent} strokeOpacity=".1"/></pattern></defs><rect width="320" height="220" fill={background}/><rect width="320" height="220" fill={`url(#portfolioGrid${index})`}/><circle cx="160" cy="111" r="86" fill="none" stroke={accent} strokeOpacity=".25"/><path d="M90 220v-45q0-64 70-64t70 64v45" fill={fur}/><circle cx="113" cy="77" r="29" fill={fur}/><circle cx="207" cy="77" r="29" fill={fur}/><circle cx="113" cy="77" r="17" fill="#bf8379"/><circle cx="207" cy="77" r="17" fill="#bf8379"/><path d="M100 103q0-46 60-46t60 46v41q0 44-60 44t-60-44z" fill={fur}/><path d="M117 139q43-28 86 0v18q0 36-43 36t-43-36z" fill="#f0dfc7"/><ellipse cx="130" cy="116" rx="7" ry="9" fill="#1c1d22"/><ellipse cx="190" cy="116" rx="7" ry="9" fill="#1c1d22"/><circle cx="132" cy="113" r="2" fill="white"/><circle cx="192" cy="113" r="2" fill="white"/><path d="m151 142 9 8 9-8q-9-9-18 0" fill="#a75f65"/><path d="M160 150v9m-12 0q12 12 24 0" fill="none" stroke="#624a42" strokeWidth="3" strokeLinecap="round"/>{index === 0 && <><path d="M97 102h126v32H97z" fill="#1c2333"/><path d="M104 105h49v19h-49zm64 0h48v19h-48z" fill={accent} fillOpacity=".6"/><path d="m109 108 23 13m44-13 23 13" stroke="white" strokeOpacity=".45"/></>}{index === 1 && <path d="m117 65-10-29 30 15 23-27 23 27 30-15-10 29z" fill={accent}/>}<circle cx="244" cy="174" r="17" fill={accent} fillOpacity=".18"/><path d="m245 160-7 15h7l-2 13 10-18h-8z" fill={accent}/></svg>;
}

export function PortfolioView({ isDemo, onConnect, connectRequested = 0 }: { isDemo: boolean; onConnect?: () => void; connectRequested?: number }) {
  const [connected, setConnected] = useState(""); const [address, setAddress] = useState(""); const [input, setInput] = useState("");
  const [chainId, setChainId] = useState(""); const [connecting, setConnecting] = useState(false); const [account, setAccount] = useState<Account | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]); const [activity, setActivity] = useState<AccountActivity[]>([]); const [historyError, setHistoryError] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [moreLoading, setMoreLoading] = useState(false); const [error, setError] = useState("");
  const [copied, setCopied] = useState(false); const [filter, setFilter] = useState("all"); const [refresh, setRefresh] = useState(0);
  const activeRequest = useRef<AbortController | null>(null); const activeAddress = useRef(address); activeAddress.current = address;
  const connectionInFlight = useRef(false); const consumedConnectRequest = useRef(0);
  const viewingDemo = isDemo && !address;
  const enrichTokens = useCallback(async (entries: Token[], signal: AbortSignal) => {
    // Metadata is optional; a missing image must never hide an owned Squeek.
    const enriched: Token[] = [];
    for (let index = 0; index < entries.length && !signal.aborted; index += 5) {
      const batch = await Promise.all(entries.slice(index, index + 5).map(async token => {
        try { const detail = await readApi<{ metadata?: { cardImageUrl?: string; imageDataUri?: string; name?: string } }>(`/squeeks/${token.tokenId}`, signal); return { ...token, image: imageUrl(detail.metadata?.cardImageUrl) ?? imageUrl(detail.metadata?.imageDataUri), name: typeof detail.metadata?.name === "string" ? detail.metadata.name : undefined }; } catch { return token; }
      })); enriched.push(...batch);
    }
    return enriched;
  }, []);

  useEffect(() => {
    if (!address) { activeRequest.current?.abort(); setAccount(null); setTokens([]); setActivity([]); setError(""); setLoading(false); return; }
    const abort = new AbortController(); activeRequest.current?.abort(); activeRequest.current = abort;
    setLoading(true); setError(""); setAccount(null); setTokens([]); setActivity([]); setCursor(null); setHistoryError(false);
    void (async () => {
      try {
        const data = await readApi<Account>(`/accounts/${address.toLowerCase()}?limit=12`, abort.signal);
        if (abort.signal.aborted) return;
        validateAccount(data);
        setAccount(data); setTokens(data.tokens!); setCursor(typeof data.nextCursor === "string" ? data.nextCursor : null); setLoading(false);
        const entries = await enrichTokens(data.tokens!, abort.signal); if (!abort.signal.aborted) setTokens(entries);
      } catch (err) { if (!abort.signal.aborted) { setError(err instanceof Error ? err.message : "Account data is unavailable."); setLoading(false); } }
    })();
    void readApi<{ activity: AccountActivity[] }>(`/accounts/${address.toLowerCase()}/activity?limit=5`, abort.signal).then(data => { if (!Array.isArray(data.activity) || !data.activity.every(item => item && typeof item.id === "string" && typeof item.kind === "string")) throw new Error("Activity response is incomplete."); if (!abort.signal.aborted) setActivity(data.activity); }).catch(() => { if (!abort.signal.aborted) setHistoryError(true); });
    return () => abort.abort();
  }, [address, refresh, enrichTokens]);

  useEffect(() => {
    const provider = getProvider(); if (!provider || !connected) return;
    const accountsChanged = (...args: unknown[]) => { const list = args[0]; const next = Array.isArray(list) && typeof list[0] === "string" ? list[0] : ""; setConnected(next); setAddress(next); setInput(next); };
    const chainChanged = (...args: unknown[]) => { if (typeof args[0] === "string") setChainId(args[0]); setRefresh(value => value + 1); };
    provider.on?.("accountsChanged", accountsChanged); provider.on?.("chainChanged", chainChanged);
    return () => { provider.removeListener?.("accountsChanged", accountsChanged); provider.removeListener?.("chainChanged", chainChanged); };
  }, [connected]);
  const connectWallet = useCallback(async () => {
    if (connectionInFlight.current) return;
    setError(""); const provider = getProvider();
    if (!provider) { setError("No browser wallet found. Install an Ethereum wallet, or look up any address below."); return; }
    connectionInFlight.current = true; setConnecting(true);
    try { const accounts = await provider.request({ method: "eth_requestAccounts" }); if (!Array.isArray(accounts) || !validAddress(accounts[0])) throw new Error("Your wallet did not return an address."); const selected = accounts[0] as string; setConnected(selected); setAddress(selected); setInput(selected); try { const chain = await provider.request({ method: "eth_chainId" }); if (typeof chain === "string") setChainId(chain); } catch { /* Public API portfolio reads are independent of the selected wallet chain. */ } onConnect?.(); }
    catch (err) { const code = (err as { code?: number })?.code; setError(code === 4001 ? "Wallet connection was declined. You can try again whenever you like." : code === -32002 ? "A wallet request is already open. Check your wallet extension." : err instanceof Error ? err.message : "Unable to connect your wallet."); }
    finally { connectionInFlight.current = false; setConnecting(false); }
  }, [onConnect]);
  // A header click can request connection after navigating into this view.
  useEffect(() => {
    if (connectRequested <= 0 || connectRequested <= consumedConnectRequest.current) return;
    consumedConnectRequest.current = connectRequested;
    void connectWallet();
  }, [connectRequested, connectWallet]);
  function disconnect() { activeRequest.current?.abort(); setConnected(""); setAddress(""); setInput(""); setChainId(""); setError(""); }
  function lookup(event: React.FormEvent) { event.preventDefault(); const value = input.trim(); if (!validAddress(value)) { setError("Enter a valid, non-zero Ethereum address (0x followed by 40 characters)."); return; } setError(""); setAddress(value.toLowerCase()); setRefresh(value => value + 1); }
  async function loadMore() {
    if (!cursor || !address || moreLoading) return; const selected = address; setMoreLoading(true); const abort = activeRequest.current;
    try { const page = await readApi<Account>(`/accounts/${selected.toLowerCase()}?limit=12&cursor=${encodeURIComponent(cursor)}`, abort?.signal); if (activeAddress.current !== selected || abort?.signal.aborted) return; validateAccount(page); const entries = page.tokens!; setTokens(previous => [...previous, ...entries.filter(next => !previous.some(token => token.tokenId === next.tokenId))]); setCursor(typeof page.nextCursor === "string" ? page.nextCursor : null); const enriched = await enrichTokens(entries, abort?.signal ?? new AbortController().signal); if (activeAddress.current === selected && !abort?.signal.aborted) setTokens(previous => previous.map(token => enriched.find(item => item.tokenId === token.tokenId) ?? token)); }
    catch (err) { if (activeAddress.current === selected) setError(err instanceof Error ? err.message : "Unable to load more Squeeks."); } finally { setMoreLoading(false); }
  }
  const shown = viewingDemo ? demo : account; const shownTokens = viewingDemo ? demoTokens : tokens;
  const shownActivity = viewingDemo ? demoActivity : activity;
  const filtered = shownTokens.filter(token => filter === "all" || token.custody === filter);
  const power = shown?.power ? (safeInteger(shown.power.nftPower) + safeInteger(shown.power.sqkPower)).toLocaleString("en-US") : "—";
  const tokenCount = shown?.tokenCounts && unsigned(shown.tokenCounts.wallet) && unsigned(shown.tokenCounts.staking) ? (safeInteger(shown.tokenCounts.wallet) + safeInteger(shown.tokenCounts.staking)).toLocaleString("en-US") : "—";
  const average = shown?.earnings?.length ? (shown.earnings.reduce((sum, day) => sum + safeInteger(day.earnedBaseUnits), ZERO) / BigInt(shown.earnings.length)).toString() : undefined;
  return <div className="portfolio-view" aria-busy={loading}>
    <section className="portfolio-connect panel">
      <div className="portfolio-wallet-mark"><Wallet size={24}/></div><div className="portfolio-connect-copy"><h2>{address ? shortAddress(address) : "Your little proof-of-work crew."}</h2><p>{address ? `${connected.toLowerCase() === address.toLowerCase() ? "Connected wallet" : "Watching address"} · Sepolia portfolio` : "Connect your wallet to see your Squeeks, power and rewards."}</p></div>
      {connected ? <button className="portfolio-secondary" onClick={disconnect}><LogOut size={15}/>Disconnect</button> : <button className="portfolio-primary" disabled={connecting} onClick={connectWallet}>{connecting ? <LoaderCircle size={16} className="portfolio-spin"/> : <Wallet size={16}/>} {connecting ? "Connecting…" : "Connect wallet"}</button>}
    </section>
    <form className="portfolio-lookup" onSubmit={lookup}><Search size={17}/><label className="portfolio-sr-only" htmlFor="portfolio-address">Ethereum address</label><input id="portfolio-address" aria-invalid={error.startsWith("Enter a valid")} aria-describedby={error ? "portfolio-error" : undefined} placeholder="Or explore any Ethereum address: 0x…" value={input} onChange={event => setInput(event.target.value)} spellCheck={false} autoComplete="off"/><button type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="portfolio-spin"/> : <>Look up <ArrowUpRight size={15}/></>}</button></form>
    {chainId && chainId.toLowerCase() !== "0xaa36a7" && <p className="portfolio-note"><ShieldCheck size={14}/> Showing Sepolia data. Your wallet is connected to another network; viewing requires no network switch.</p>}
    {error && <div className="portfolio-alert" role="alert" id="portfolio-error"><CircleAlert size={18}/><span>{error}</span>{address && <button onClick={() => setRefresh(value => value + 1)}>Retry</button>}</div>}
    {viewingDemo && <p className="portfolio-demo-label"><span/> Example portfolio · Illustrative Squeeks and balances. Connect or enter an address to view real data.</p>}
    {(shown || address || loading) && <>
      <div className="portfolio-stats">
        <div className="panel portfolio-stat"><span><Zap size={15}/>Total active power</span><strong>{loading ? "…" : power}<small>PWR</small></strong><p>{shown?.power ? `${safeInteger(shown.power.nftPower).toLocaleString("en-US")} NFT + ${safeInteger(shown.power.sqkPower).toLocaleString("en-US")} staked SQK power` : "Awaiting account data"}</p></div>
        <div className="panel portfolio-stat"><span><Coins size={15}/>Claimable rewards</span><strong className="portfolio-gold">{loading ? "…" : amount(shown?.rewards?.claimableBaseUnits)}<small>SQK</small></strong><p>Accrued across your entire account</p></div>
        <div className="panel portfolio-stat"><span><ShieldCheck size={15}/>SQK staked</span><strong>{loading ? "…" : amount(shown?.stake?.principalBaseUnits, 0)}<small>SQK</small></strong><p>Power that keeps working for you</p></div>
        <div className="panel portfolio-stat"><span><ArrowDownLeft size={15}/>Daily earnings</span><strong>{loading ? "…" : amount(average)}<small>SQK</small></strong><p>Average of reported 7-day earnings</p></div>
      </div>
      <div className="portfolio-section-head"><div><h2>Your Squeeks <span>{tokenCount}</span></h2><p>A small crew. A whole lot of potential.</p></div><div className="portfolio-filter">{[ ["all", "All Squeeks"], ["staking", "Staked"], ["wallet", "In wallet"] ].map(([key, label]) => <button key={key} onClick={() => setFilter(key)} aria-pressed={filter === key} className={filter === key ? "active" : ""}>{label}</button>)}</div></div>
      {loading ? <div className="portfolio-loading panel" role="status" aria-live="polite"><LoaderCircle className="portfolio-spin" size={26}/><p>Finding your Squeeks…</p></div> : filtered.length ? <div className="portfolio-nfts">{filtered.map((token, index) => <article className="panel portfolio-nft" key={token.tokenId}><div className="portfolio-art">{viewingDemo ? <HamsterPortrait index={index}/> : <TokenPortrait token={token}/>}<span className={`portfolio-custody ${token.custody}`}>{token.custody === "staking" ? <Zap size={11}/> : <Wallet size={11}/>} {token.custody === "staking" ? "Staked & earning" : "In wallet"}</span></div><div className="portfolio-nft-body"><div className="portfolio-nft-title"><h3>{token.name ?? `Squeek #${token.tokenId}`}</h3><span>LVL {token.level}</span></div><div className="portfolio-nft-power"><span>Base power</span><strong><Zap size={13}/>{safeInteger(token.basePower).toLocaleString("en-US")}</strong></div><p>{token.custody === "staking" ? "Contributing to your account rewards" : "Deposit to activate this Squeek’s power"}</p>{!viewingDemo && <a href={`https://sepolia.etherscan.io/nft/0x0eAF3E0d40A0a8E5a6Ac030b2459E9FB0B7905c6/${token.tokenId}`} target="_blank" rel="noreferrer">View on explorer <ArrowUpRight size={14}/></a>}</div></article>)}</div> : <div className="portfolio-loading panel"><Wallet size={28}/><h3>{account ? "No Squeeks here yet" : "Portfolio data unavailable"}</h3><p>{account ? "Try another filter or explore a different address." : "Balances and Squeeks will appear when the API is available."}</p></div>}
      {cursor && <button className="portfolio-load-more portfolio-secondary" onClick={loadMore} disabled={moreLoading}>{moreLoading ? <LoaderCircle className="portfolio-spin" size={16}/> : <ChevronRight size={16}/>}Load more Squeeks</button>}
      <div className="portfolio-bottom"><section className="panel portfolio-history"><div className="portfolio-section-head"><h2>Recent activity</h2>{address && <button title="Copy wallet address" aria-label={copied ? "Address copied" : "Copy wallet address"} className="portfolio-copy" onClick={async () => { try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setError("Unable to copy the address. You can select it in the address field."); } }}>{copied ? <Check size={15}/> : <Copy size={15}/>}</button>}</div>{historyError && !viewingDemo ? <p className="portfolio-empty">Activity is currently unavailable.</p> : shownActivity.length ? shownActivity.map((item, index) => <div className="portfolio-activity" key={item.id}><span className="portfolio-activity-icon">{item.kind.includes("claim") ? <Coins size={17}/> : item.kind.includes("nft") ? <Wallet size={17}/> : <Zap size={17}/>}</span><div><strong>{item.kind.replaceAll("_", " ").replace(/^./, c => c.toUpperCase())}</strong><p>{viewingDemo ? ["Example · 2 hours ago", "Example · 1 day ago", "Example · 2 days ago"][index] : item.source?.blockTimestamp ? new Date(item.source.blockTimestamp).toLocaleString() : "Confirmed on Sepolia"}</p></div><b>{item.amountBaseUnits ? `${amount(item.amountBaseUnits, 0)} SQK` : item.tokenId ? `#${item.tokenId}` : "Confirmed"}</b>{item.source?.transactionHash && /^0x[0-9a-fA-F]{64}$/.test(item.source.transactionHash) && <a aria-label="View transaction" href={`https://sepolia.etherscan.io/tx/${item.source.transactionHash}`} target="_blank" rel="noreferrer"><ArrowUpRight size={15}/></a>}</div>) : <p className="portfolio-empty">{loading ? "Loading activity…" : "No activity to show."}</p>}</section><section className="panel portfolio-reward-card"><span className="portfolio-reward-icon"><Coins size={23}/></span><h2>Good things come<br/>to those who squeek.</h2><p>Rewards accrue to your account. Review your claim and manage staking in the official Squeekchain app.</p><a href="https://squeekchain.com" target="_blank" rel="noreferrer">Open Squeekchain <ExternalLink size={15}/></a><small>Sepolia testnet · SQK has no monetary value</small></section></div>
    </>}
    {!shown && !address && !loading && <section className="panel portfolio-welcome"><span className="portfolio-welcome-icon"><Wallet size={32}/></span><h2>Your next chapter starts with a Squeek.</h2><p>Connect an Ethereum wallet or paste an address to explore your collection.<br/>Your NFTs, active power and rewards, all in one place.</p><span><ShieldCheck size={14}/>Read-only connection · No signature required</span></section>}
    <style>{`
      .portfolio-view{display:flex;flex-direction:column;gap:22px;color:#e9eaf0}.portfolio-view button,.portfolio-view input{font:inherit}.portfolio-view :is(button,a,input):focus-visible{outline:2px solid #80aaff;outline-offset:4px}.portfolio-view input:focus-visible{outline-offset:2px}.portfolio-view a{min-height:24px}.portfolio-connect{display:flex;align-items:center;padding:24px;gap:18px;background:linear-gradient(110deg,#182031,#14161b 58%)}.portfolio-wallet-mark{display:grid;place-items:center;width:52px;height:52px;border:1px solid #3b5076;background:#23334f;border-radius:15px;color:#84afff;flex-shrink:0}.portfolio-connect-copy{flex:1}.portfolio-connect h2{font-size:18px;letter-spacing:-.4px;margin:0 0 7px}.portfolio-connect p,.portfolio-section-head p{font-size:13px;color:#8e929f;margin:0}.portfolio-primary,.portfolio-secondary{border:0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 16px;font-size:13px;font-weight:600;cursor:pointer}.portfolio-primary{background:#528fff;color:white;box-shadow:0 4px 16px #528fff20}.portfolio-primary:hover{background:#6d9fff}.portfolio-secondary{background:#20232b;color:#d9dce5;border:1px solid #323640}.portfolio-secondary:hover{background:#2b303b}.portfolio-view button:disabled{opacity:.55;cursor:wait}.portfolio-lookup{height:48px;display:flex;align-items:center;gap:12px;padding:0 7px 0 16px;border:1px solid #292c35;border-radius:9px;background:#13151b;color:#777d8b}.portfolio-lookup input{min-width:0;flex:1;background:none;border:0;outline:none;color:#dce2ef;font-size:13px}.portfolio-lookup:focus-within{border-color:#528fff}.portfolio-lookup button{display:flex;align-items:center;gap:7px;border:0;border-radius:6px;background:#242b3b;color:#acbfe5;padding:8px 12px;cursor:pointer;font-size:12px}.portfolio-alert{display:flex;align-items:center;gap:11px;border:1px solid #6c5234;border-radius:9px;background:#2b2218;color:#e6bf87;padding:15px;font-size:13px;line-height:1.6}.portfolio-alert svg{flex-shrink:0}.portfolio-alert button{margin-left:auto;color:#e6bf87;border:0;background:transparent;text-decoration:underline;cursor:pointer}.portfolio-note,.portfolio-demo-label{font-size:12px;color:#9a9fab;display:flex;align-items:center;gap:8px;line-height:1.6;margin:0}.portfolio-demo-label span{width:6px;height:6px;background:#eebf64;border-radius:50%;flex-shrink:0}.portfolio-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.portfolio-stat{padding:22px}.portfolio-stat>span{font-size:12px;color:#9297a5;display:flex;align-items:center;gap:7px}.portfolio-stat strong{display:block;font-size:28px;font-weight:600;letter-spacing:-1px;margin-top:19px;font-variant-numeric:tabular-nums;white-space:nowrap}.portfolio-stat strong{overflow-wrap:anywhere;white-space:normal}.portfolio-stat strong small{font-size:11px;color:#7f8594;font-weight:500;letter-spacing:0;margin-left:7px}.portfolio-stat p{font-size:11px;color:#7c8291;margin:9px 0 0;line-height:1.5}.portfolio-gold{color:#eebf64}.portfolio-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.portfolio-section-head h2{font-size:16px;font-weight:600;letter-spacing:-.3px;margin:0}.portfolio-section-head h2 span{display:inline-grid;place-items:center;font-size:11px;color:#a3aab9;background:#222630;border:1px solid #323846;border-radius:5px;min-width:21px;height:20px;margin-left:6px;padding:0 4px}.portfolio-section-head p{margin-top:7px;font-size:12px}.portfolio-filter{display:flex;padding:4px;background:#15171d;border:1px solid #262a33;border-radius:8px;gap:3px}.portfolio-filter button{border:0;background:transparent;border-radius:5px;padding:7px 11px;color:#828997;font-size:12px;cursor:pointer}.portfolio-filter button.active{background:#2a2e38;color:#f1f2f6}.portfolio-nfts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.portfolio-nft{overflow:hidden;transition:border-color .2s,transform .2s}.portfolio-nft:hover{transform:translateY(-3px);border-color:#455674}.portfolio-art{position:relative;background:#1b202a;aspect-ratio:320/220;overflow:hidden}.portfolio-art>svg,.portfolio-art>img{display:block;width:100%;height:100%;object-fit:cover}.portfolio-custody{position:absolute;bottom:12px;left:12px;display:flex;align-items:center;gap:5px;font-size:10px;background:#131a20e8;padding:6px 8px;border:1px solid #ffffff1c;border-radius:5px;color:#c4ccd9}.portfolio-custody.staking{color:#90d7b0}.portfolio-nft-body{padding:19px}.portfolio-nft-title{display:flex;align-items:center;justify-content:space-between;gap:10px}.portfolio-nft-title h3{margin:0;font-size:15px;font-weight:600;letter-spacing:-.2px}.portfolio-nft-title>span{font-size:9px;font-weight:600;letter-spacing:.7px;color:#b5bdcc;border:1px solid #343b48;background:#242a35;padding:5px 6px;border-radius:4px}.portfolio-nft-power{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #252933;margin-top:17px;padding-top:15px;font-size:12px;color:#858e9f}.portfolio-nft-power strong{display:flex;gap:5px;align-items:center;color:#8aafff;font-size:14px;font-weight:600}.portfolio-nft-body>p{font-size:10px;color:#70798a;margin:10px 0 0}.portfolio-nft-body>a{display:flex;align-items:center;justify-content:space-between;color:#8eaff0;font-size:12px;margin-top:17px;text-decoration:none}.portfolio-image-pending{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#697489;font-size:12px}.portfolio-loading{min-height:240px;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#8b95a9;gap:10px}.portfolio-loading h3{font-size:16px;font-weight:500;margin:0}.portfolio-loading p{font-size:13px;margin:0;text-align:center;padding:0 20px}.portfolio-load-more{align-self:center}.portfolio-bottom{display:grid;grid-template-columns:1.7fr 1fr;gap:20px}.portfolio-history{padding:23px}.portfolio-history>.portfolio-section-head{margin-bottom:10px}.portfolio-copy{background:transparent;border:0;color:#8894a9;cursor:pointer;padding:4px}.portfolio-activity{display:flex;align-items:center;gap:12px;padding:19px 0;border-bottom:1px solid #242832}.portfolio-activity:last-child{border-bottom:0;padding-bottom:0}.portfolio-activity-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#212a3c;color:#86aaff;flex-shrink:0}.portfolio-activity>div{flex:1}.portfolio-activity strong{font-size:12px;font-weight:500}.portfolio-activity p{font-size:10px;color:#747e90;margin:5px 0 0}.portfolio-activity b{font-size:12px;font-weight:500;color:#c3ccde}.portfolio-activity>a{color:#747e90;display:flex}.portfolio-empty{color:#7e899d;font-size:13px;padding:25px 0}.portfolio-reward-card{padding:24px;background:radial-gradient(ellipse at 90% 10%,#eebf6414,transparent 70%),#17171a}.portfolio-reward-icon{display:grid;place-items:center;width:45px;height:45px;border-radius:12px;border:1px solid #eebf6433;background:#eebf6414;color:#eebf64}.portfolio-reward-card h2{font-size:22px;line-height:1.4;letter-spacing:-.6px;font-weight:500;margin:17px 0 10px}.portfolio-reward-card p{color:#8f8e94;font-size:12px;line-height:1.7;max-width:300px}.portfolio-reward-card>a{display:inline-flex;align-items:center;gap:14px;color:#eebf64;text-decoration:none;font-size:12px;margin:5px 0 16px}.portfolio-reward-card small{display:block;color:#6d707b;font-size:9px}.portfolio-welcome{padding:80px 25px;text-align:center;background:radial-gradient(ellipse at 50% 20%,#528fff0c,transparent 60%),#14161b}.portfolio-welcome-icon{display:grid;place-items:center;width:70px;height:70px;border:1px solid #528fff30;border-radius:22px;background:#528fff10;color:#7ca6f4;margin:0 auto 25px}.portfolio-welcome h2{font-size:24px;letter-spacing:-.6px;font-weight:500;margin:0 0 14px}.portfolio-welcome p{font-size:13px;color:#818a9c;line-height:1.8;margin:0 0 27px}.portfolio-welcome>span:last-child{display:inline-flex;align-items:center;gap:7px;color:#687b98;font-size:11px}.portfolio-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.portfolio-spin{animation:portfolio-spin 1s linear infinite}@keyframes portfolio-spin{to{transform:rotate(360deg)}}
      @media(max-width:1200px){.portfolio-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.portfolio-stat strong{font-size:26px}.portfolio-nfts{gap:13px}.portfolio-nft-title h3{font-size:13px}.portfolio-nft-body{padding:15px}}
      @media(max-width:700px){.portfolio-view{gap:18px}.portfolio-connect{flex-wrap:wrap;padding:19px;gap:13px}.portfolio-connect-copy{min-width:180px}.portfolio-connect h2{font-size:16px}.portfolio-connect p{font-size:12px;line-height:1.6}.portfolio-connect>.portfolio-primary,.portfolio-connect>.portfolio-secondary{width:100%}.portfolio-lookup{gap:7px;padding-left:11px}.portfolio-lookup input{font-size:11px}.portfolio-lookup button{font-size:11px;padding:8px}.portfolio-stats{gap:10px}.portfolio-stat{padding:17px}.portfolio-stat>span{font-size:10px}.portfolio-stat strong{font-size:23px}.portfolio-stat strong small{font-size:9px}.portfolio-stat p{font-size:10px}.portfolio-section-head{align-items:flex-start;flex-wrap:wrap;gap:14px}.portfolio-nfts{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.portfolio-nft-title{flex-wrap:wrap;gap:8px}.portfolio-nft-title h3{font-size:13px}.portfolio-nft-body{padding:13px}.portfolio-nft-body>p{line-height:1.5}.portfolio-custody{font-size:8px;padding:5px 6px;left:8px;bottom:8px}.portfolio-bottom{grid-template-columns:1fr}.portfolio-activity{gap:9px}.portfolio-activity b{font-size:11px}.portfolio-activity strong{font-size:11px}.portfolio-activity-icon{width:29px;height:29px}.portfolio-history{padding:19px}.portfolio-welcome{padding:55px 20px}.portfolio-welcome h2{font-size:21px}.portfolio-demo-label{font-size:10px}}
      @media(prefers-reduced-motion:reduce){.portfolio-spin{animation:none}.portfolio-nft{transition:none}.portfolio-nft:hover{transform:none}}
    `}</style>
  </div>;
}
