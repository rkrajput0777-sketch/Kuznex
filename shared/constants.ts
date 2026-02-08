export const ADMIN_WALLETS = {
  COLD_WALLET: "0x0000000000000000000000000000000000000000",
};

export const ETHERSCAN_V2_BASE = "https://api.etherscan.io/v2/api";

export const SUPPORTED_CHAINS: Record<string, { chainId: number; name: string; shortName: string; explorer: string; rpcUrl: string; nativeCurrency: string }> = {
  ethereum: { chainId: 1, name: "Ethereum (ERC20)", shortName: "ETH", explorer: "https://etherscan.io", rpcUrl: "https://eth.llamarpc.com", nativeCurrency: "ETH" },
  bsc: { chainId: 56, name: "BSC (BEP20)", shortName: "BSC", explorer: "https://bscscan.com", rpcUrl: "https://bsc-dataseed.binance.org", nativeCurrency: "BNB" },
  polygon: { chainId: 137, name: "Polygon (MATIC)", shortName: "MATIC", explorer: "https://polygonscan.com", rpcUrl: "https://polygon-rpc.com", nativeCurrency: "MATIC" },
  base: { chainId: 8453, name: "Base", shortName: "BASE", explorer: "https://basescan.org", rpcUrl: "https://mainnet.base.org", nativeCurrency: "ETH" },
};

export const SUPPORTED_NETWORKS = Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => ({
  id,
  name: chain.name,
  chainId: chain.chainId,
  explorer: chain.explorer,
}));

export const SUPPORTED_CURRENCIES = ["INR", "USDT", "BTC", "ETH", "BNB"] as const;
export type Currency = typeof SUPPORTED_CURRENCIES[number];

export const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  USDT: "tether",
};

export const NATIVE_CURRENCY_MAP: Record<number, string> = {
  1: "ETH",
  56: "BNB",
  137: "ETH",
  8453: "ETH",
};

export const VERIFIED_TOKEN_CONTRACTS: Record<number, Record<string, { currency: string; decimals: number }>> = {
  1: {
    "0xdac17f958d2ee523a2206206994597c13d831ec7": { currency: "USDT", decimals: 6 },
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { currency: "USDT", decimals: 6 },
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { currency: "ETH", decimals: 18 },
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": { currency: "BTC", decimals: 8 },
  },
  56: {
    "0x55d398326f99059ff775485246999027b3197955": { currency: "USDT", decimals: 18 },
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": { currency: "USDT", decimals: 18 },
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": { currency: "BNB", decimals: 18 },
    "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c": { currency: "BTC", decimals: 18 },
    "0x2170ed0880ac9a755fd29b2688956bd959f933f8": { currency: "ETH", decimals: 18 },
  },
  137: {
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": { currency: "USDT", decimals: 6 },
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": { currency: "USDT", decimals: 6 },
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": { currency: "USDT", decimals: 6 },
    "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": { currency: "ETH", decimals: 18 },
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": { currency: "BTC", decimals: 8 },
  },
  8453: {
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { currency: "USDT", decimals: 6 },
    "0x4200000000000000000000000000000000000006": { currency: "ETH", decimals: 18 },
  },
};

export const SWAP_SPREAD_PERCENT = 1;

export const ADMIN_BANK_DETAILS = {
  bankName: "To be configured",
  accountNumber: "To be configured",
  ifscCode: "To be configured",
  accountHolder: "Kuznex Pvt Ltd",
  upiId: "To be configured",
};
