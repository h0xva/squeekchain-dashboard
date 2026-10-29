# Squeekchain dashboard

A complete community dashboard for Squeekchain, with an overview, historical analytics, and an Ethereum wallet portfolio. Built with TypeScript, React 19, the Next.js App Router API through Vinext, Tailwind CSS 4, Recharts, and Lucide. The Vinext/Vite adapter makes the Next application deployable through Sites on Cloudflare Workers.

## Run locally

Requires Node.js 22.13+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by the server (normally http://localhost:5173). For standard Next.js development, `npx next dev` also uses the same App Router sources; Sites production builds use Vinext.

```sh
npm run typecheck
npm run test:api
npm run build
```

## Views and interactions

- **Overview:** settled block height, measured distance and speed, actual 24-hour issuance, next-block progress, measured ETA, switchable distance/work area chart, settlements and token supply.
- **Analytics:** 7/30-day windows, distance/work/blocks, typical-day productivity, latest difficulty, and documented activity records. No fabricated historical difficulty curve.
- **Portfolio:** injected EIP-1193 Ethereum wallet connection, account/chain change handling, wallet disconnect within the dashboard, or public address lookup. Collection images, level, base power, custody filters, pagination, staking, account-wide rewards and recent history. No signature or transaction is requested. Claims and staking are managed through the official Squeekchain application.
- **Navigation:** responsive sidebar, external block explorer/docs, contract-address dialog with copy controls, keyboard focus handling, reduced-motion support, and Demo/Live controls.

## Live and demo data

The initial demo is visibly labeled. The application checks the public API and automatically selects Live if data is available, until the user explicitly selects a mode. Live mode never inserts demo values. Unknown or unavailable values remain null and display as `—`; missing historical observations remain gaps. The demo contains synthetic fixtures and sample NFT art, with no real transaction links.

The public API could not be reached from the build environment on 29 October 2026. Integration follows the official schemas at https://docs.squeekchain.com/developers/api/ and is covered by deterministic adapter tests. A real wallet and live data must be verified when the upstream API is reachable.

The public API is requested directly from the browser with no credentials. No API key or WalletConnect project ID is needed. Wallet connection supports an installed injected Ethereum wallet; mobile WalletConnect QR sessions are not included. Public address lookup works without a wallet.

## Data semantics

- SQK uses 18 decimals. Base-unit values retain BigInt precision before display conversion.
- Distance is converted from mm to km; measured speed from mm/s to km/h.
- Activity days run from **12:00 UTC to 12:00 UTC**, as defined by the source API.
- Block height is the settled frontier; next-block progress follows the projected frontier and is labeled with its own height.
- ETA appears only after a reliable positive work delta across fresh observations. It is an estimate, not a protocol promise.
- Network staking and claimable rewards are account-wide; NFT cards do not fabricate individual reward allocations.
- Settled work and mining issuance are separate on-chain events. The adapter never multiplies completed blocks by a fixed reward to invent issuance.
- Difficulty is the latest documented work-per-thousand-blocks value, not a historical time series.
- Sepolia block issuance is 5,600 SQK; the planned mainnet figure is 6,900. Maximum SQK supply is 2.1 billion and maximum NFT count is 9,999.

## Polling and failure handling

The visible page polls every 15 seconds. The adapter caches status, stats, economy and settlements by endpoint TTL, requests independent sources concurrently, and suspends polling in hidden tabs. Requests time out after 8 seconds. Errors back off for 30 seconds for status and 60 seconds for other sources; HTTP `Retry-After` is respected. Stale measurements, unsupported schema versions, deployment identity mismatch, HTTP errors and `status: unavailable` are treated explicitly. No stale data is presented as a current live measurement.

## Source layout

- `app/`: App Router entry, metadata and shared theme.
- `components/dashboard.tsx`: shell, Overview, navigation, source controls and dialogs.
- `components/analytics-view.tsx`: historical exploration and records.
- `components/portfolio-view.tsx`: wallet provider and read-only account explorer.
- `components/wheel-scene.tsx`: original SVG WHEELY9000 illustration and CSS motion.
- `lib/squeek-api.ts`: schema validation, unit conversion, cache, backoff and demo fixtures.
- `scripts/verify-squeek-api.mjs`: API failure and conversion verification.
- `.openai/hosting.json`: private Sites project identity; contains no secrets.

All contracts are linked to Sepolia Etherscan. This community dashboard is independent of the official application.
