export const ADMIN_WALLETS = {
  BSC_BEP20: "0x0000000000000000000000000000000000000000",
  POLYGON_MATIC: "0x0000000000000000000000000000000000000000",
};

export const SUPPORTED_NETWORKS = [
  { id: "bsc", name: "BSC (BEP20)", explorer: "https://bscscan.com", apiBase: "https://api.bscscan.com/api" },
  { id: "polygon", name: "Polygon (MATIC)", explorer: "https://polygonscan.com", apiBase: "https://api.polygonscan.com/api" },
] as const;

export const SUPPORTED_CURRENCIES = ["INR", "USDT", "BTC", "ETH", "BNB"] as const;
export type Currency = typeof SUPPORTED_CURRENCIES[number];

export const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  USDT: "tether",
};

export const SWAP_SPREAD_PERCENT = 1;

export const ADMIN_BANK_DETAILS = {
  bankName: "To be configured",
  accountNumber: "To be configured",
  ifscCode: "To be configured",
  accountHolder: "Kuznex Pvt Ltd",
  upiId: "To be configured",
};
