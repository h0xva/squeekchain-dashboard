/** Single source of truth for the deployment this dashboard is pinned to.
 * The API adapters reject any response that reports different contracts, so
 * updating an address here is the only change needed after a redeployment.
 */
export const NETWORK = {
  name: "Sepolia",
  chainIdHex: "0xaa36a7",
  explorer: "https://sepolia.etherscan.io",
} as const;

export const CONTRACTS = {
  core: {
    label: "SqueekCore",
    address: "0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44",
    role: "Verifies wheel work and settles Squeek blocks",
  },
  mining: {
    label: "SqueekMining",
    address: "0xcd46990f8349057335289ef282c276204b6cdc62",
    role: "Issues SQK to Squeek holders by active power",
  },
  token: {
    label: "SQK",
    address: "0x5501e1fa81be1c3f49225fa7668da0245d07db60",
    role: "Reward token · 18 decimals · 2.1B cap",
  },
  nft: {
    label: "SqueekNFT",
    address: "0xcb98349c134ab983da5bfd80527dfe2552bdb70f",
    role: "Genesis Squeeks · 9,999 maximum",
  },
} as const;

export type ContractKey = keyof typeof CONTRACTS;

export const PROTOCOL = {
  blockRewardSepolia: 5_600,
  blockRewardMainnet: 6_900,
  maxSupply: 2_100_000_000,
  maxSqueeks: 9_999,
} as const;

export const LINKS = {
  site: "https://squeekchain.com",
  genesis: "https://squeekchain.com/genesis",
  /** The maintainer's Genesis invite link, labelled as such wherever it appears. */
  invite: "https://squeekchain.com/genesis/i/4tnz8br4",
  docs: "https://docs.squeekchain.com/",
  api: "https://docs.squeekchain.com/developers/api/",
  apiBase: "https://api.squeekchain.com/v1",
  buildWithAi: "https://docs.squeekchain.com/developers/build-with-ai/",
  developers: "https://docs.squeekchain.com/developers/",
  x: "https://x.com/squeekchain",
  repo: "https://github.com/h0xva/squeekchain-dashboard",
} as const;

export const addressUrl = (address: string) => `${NETWORK.explorer}/address/${address}`;
export const txUrl = (hash: string) => `${NETWORK.explorer}/tx/${hash}`;
export const squeekUrl = (tokenId: string) => `${NETWORK.explorer}/nft/${CONTRACTS.nft.address}/${tokenId}`;
