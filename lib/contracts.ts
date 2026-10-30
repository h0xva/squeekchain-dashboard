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
    address: "0x74665dAecA35A2303e767E76a2FF1FB6F93e119f",
    role: "Verifies wheel work and settles Squeek blocks",
  },
  mining: {
    label: "SqueekMining",
    address: "0x3beE588fC20dE788Bac17d33b41Da7346cb27EC4",
    role: "Issues SQK to Squeek holders by active power",
  },
  token: {
    label: "SQK",
    address: "0x6872bfa5ccc3e9e440c6c16e5ffdabb8dba4cc76",
    role: "Reward token · 18 decimals · 2.1B cap",
  },
  nft: {
    label: "SqueekNFT",
    address: "0x0eAF3E0d40A0a8E5a6Ac030b2459E9FB0B7905c6",
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
