export const SUPER_ADMIN_EMAIL = "rkrajput0777@gmail.com";

export const ADMIN_WALLETS = {
  COLD_WALLET: process.env.ADMIN_COLD_WALLET || "0x0000000000000000000000000000000000000000",
};

export const ETHERSCAN_V2_BASE = "https://api.etherscan.io/v2/api";

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  explorer: string;
  rpcUrl: string;
  nativeCurrency: string;
  minDeposit: number;
  minWithdrawal: number;
  withdrawalFee: number;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: { chainId: 1, name: "Ethereum (ERC20)", shortName: "ETH", explorer: "https://etherscan.io", rpcUrl: "https://eth.llamarpc.com", nativeCurrency: "ETH", minDeposit: 10, minWithdrawal: 20, withdrawalFee: 5 },
  bsc: { chainId: 56, name: "BSC (BEP20)", shortName: "BSC", explorer: "https://bscscan.com", rpcUrl: "https://bsc-dataseed.binance.org", nativeCurrency: "BNB", minDeposit: 1, minWithdrawal: 5, withdrawalFee: 0.5 },
  polygon: { chainId: 137, name: "Polygon (MATIC)", shortName: "MATIC", explorer: "https://polygonscan.com", rpcUrl: "https://polygon-rpc.com", nativeCurrency: "MATIC", minDeposit: 1, minWithdrawal: 5, withdrawalFee: 0.1 },
  base: { chainId: 8453, name: "Base", shortName: "BASE", explorer: "https://basescan.org", rpcUrl: "https://mainnet.base.org", nativeCurrency: "ETH", minDeposit: 1, minWithdrawal: 5, withdrawalFee: 0.1 },
  arbitrum: { chainId: 42161, name: "Arbitrum One", shortName: "ARB", explorer: "https://arbiscan.io", rpcUrl: "https://arb1.arbitrum.io/rpc", nativeCurrency: "ETH", minDeposit: 2, minWithdrawal: 5, withdrawalFee: 0.5 },
  optimism: { chainId: 10, name: "Optimism", shortName: "OP", explorer: "https://optimistic.etherscan.io", rpcUrl: "https://mainnet.optimism.io", nativeCurrency: "ETH", minDeposit: 2, minWithdrawal: 5, withdrawalFee: 0.5 },
  avalanche: { chainId: 43114, name: "Avalanche C-Chain", shortName: "AVAX", explorer: "https://snowtrace.io", rpcUrl: "https://api.avax.network/ext/bc/C/rpc", nativeCurrency: "AVAX", minDeposit: 2, minWithdrawal: 5, withdrawalFee: 0.5 },
  fantom: { chainId: 250, name: "Fantom", shortName: "FTM", explorer: "https://ftmscan.com", rpcUrl: "https://rpc.ftm.tools", nativeCurrency: "FTM", minDeposit: 1, minWithdrawal: 5, withdrawalFee: 0.1 },
};

export const SUPPORTED_NETWORKS = Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => ({
  id,
  name: chain.name,
  chainId: chain.chainId,
  explorer: chain.explorer,
  minDeposit: chain.minDeposit,
  minWithdrawal: chain.minWithdrawal,
  withdrawalFee: chain.withdrawalFee,
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
  42161: "ETH",
  10: "ETH",
  43114: "ETH",
  250: "ETH",
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
  42161: {
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": { currency: "USDT", decimals: 6 },
    "0xaf88d065e77c8cc2239327c5edb3a432268e5831": { currency: "USDT", decimals: 6 },
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": { currency: "USDT", decimals: 6 },
    "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": { currency: "ETH", decimals: 18 },
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": { currency: "BTC", decimals: 8 },
  },
  10: {
    "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": { currency: "USDT", decimals: 6 },
    "0x0b2c639c533813f4aa9d7837caf62653d097ff85": { currency: "USDT", decimals: 6 },
    "0x7f5c764cbc14f9669b88837ca1490cca17c31607": { currency: "USDT", decimals: 6 },
    "0x4200000000000000000000000000000000000006": { currency: "ETH", decimals: 18 },
    "0x68f180fcce6836688e9084f035309e29bf0a2095": { currency: "BTC", decimals: 8 },
  },
  43114: {
    "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": { currency: "USDT", decimals: 6 },
    "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": { currency: "USDT", decimals: 6 },
    "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab": { currency: "ETH", decimals: 18 },
    "0x152b9d0fdc40c096de345726399fc05a58728523": { currency: "BTC", decimals: 8 },
  },
  250: {
    "0x049d68029688eabf473097a2fc38ef61633a3c7a": { currency: "USDT", decimals: 6 },
    "0x04068da6c83afcfa0e13ba15a6696662335d5b75": { currency: "USDT", decimals: 6 },
    "0x74b23882a30290451a17c44f4f05243b6b58c76d": { currency: "ETH", decimals: 18 },
    "0x321162cd933e2be498cd2267a90534a804051b11": { currency: "BTC", decimals: 8 },
  },
};

export const SWAP_SPREAD_PERCENT = 1;

export const SPOT_TRADING_FEE = 0.001;

export const TRADABLE_PAIRS = [
  { symbol: "BTCUSDT", base: "BTC", quote: "USDT", displayName: "BTC/USDT" },
  { symbol: "ETHUSDT", base: "ETH", quote: "USDT", displayName: "ETH/USDT" },
  { symbol: "BNBUSDT", base: "BNB", quote: "USDT", displayName: "BNB/USDT" },
] as const;

export const VIEWABLE_PAIRS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "DOTUSDT", "MATICUSDT",
  "LINKUSDT", "LTCUSDT", "UNIUSDT", "SHIBUSDT", "ATOMUSDT",
  "NEARUSDT", "APTUSDT", "ARBUSDT", "OPUSDT", "FILUSDT",
  "AAVEUSDT", "MKRUSDT", "GRTUSDT", "INJUSDT", "FETUSDT",
  "RNDRUSDT", "SUIUSDT", "SEIUSDT", "TIAUSDT", "JUPUSDT",
  "PEPEUSDT", "WIFUSDT", "BONKUSDT", "FLOKIUSDT", "ONDOUSDT",
  "STXUSDT", "IMXUSDT", "MANAUSDT", "SANDUSDT", "AXSUSDT",
  "GALAUSDT", "APEUSDT", "CHZUSDT", "ENJUSDT", "LRCUSDT",
  "CRVUSDT", "COMPUSDT", "SNXUSDT", "SUSHIUSDT", "YFIUSDT",
  "BALUSDT", "1INCHUSDT", "DYDXUSDT", "GMXUSDT", "LDOUSDT",
  "RUNEUSDT", "ROSEUSDT", "KAVAUSDT", "ALGOUSDT", "VETUSDT",
  "EGLDUSDT", "FTMUSDT", "HBARUSDT", "ICPUSDT", "FLOWUSDT",
  "MINAUSDT", "QNTUSDT", "ZILUSDT", "IOTAUSDT", "XTZUSDT",
  "EOSUSDT", "NEOUSDT", "XLMUSDT", "TRXUSDT", "ETCUSDT",
  "BCHUSDT", "ZECUSDT", "DASHUSDT", "XMRUSDT", "WAVESUSDT",
  "KSMUSDT", "CELUSDT", "CAKEUSDT", "ONEUSDT", "HOTUSDT",
  "IOSTUSDT", "ONTUSDT", "ANKRUSDT", "RVNUSDT", "ICXUSDT",
  "ZENUSDT", "BATUSDT", "SKLUSDT", "CELRUSDT", "COTIUSDT",
  "CKBUSDT", "MTLUSDT", "DENTUSDT", "STORJUSDT", "REQUSDT",
  "NMRUSDT", "OGUSUSDT", "BANDUSDT", "RLCUSDT", "CTSIUSDT",
  "TLMUSDT", "XECUSDT", "OGNUSDT", "RADUSDT", "JOEUSDT",
  "WOOUSDT", "AGLDUSDT", "YGGUSDT", "HIGHUSDT", "HOOKUSDT",
  "MAGICUSDT", "TUSDT", "IDUSDT", "AMBUSDT", "LEVERUSDT",
  "RDNTUSDT", "PENDLEUSDT", "ARKMUSDT", "WLDUSDT", "CYBERUSDT",
  "ORDIUSDT", "SATSUSDT", "1000SATSUSDT", "KASUSDT", "CFXUSDT",
  "ACHUSDT", "SSVUSDT", "BLURUSDT", "ARPAUSDT", "LQTYUSDT",
  "UMAUSDT", "KEYUSDT", "COMBOUSDT", "MAVUSDT", "XVSUSDT",
  "EDUUSDT", "SUIUSDT", "GALUSDT", "TRUUSDT", "POLYXUSDT",
  "GASUSDT", "POWRUSDT", "TOKENUSDT", "TWTUSDT", "RSRUSDT",
  "AUDIOUSDT", "ENSUSDT", "LITUSDT", "DARUSDT", "PHBUSDT",
  "BLZUSDT", "STEEMUSDT", "PERPUSDT", "BNXUSDT", "LPTUSDT",
  "API3USDT", "BICOUSDT", "QKCUSDT", "ALPHAUSDT", "VIBUSDT",
  "SUPERUSDT", "AEVOUSDT", "PORTALUSDT", "PIXELUSDT", "STRKUSDT",
  "MANTAUSDT", "ALTUSDT", "ZETAUSDT", "DYMUSDT", "AIUSDT",
  "XAIUSDT", "WUSDT", "TNSRUSDT", "SAGAUSDT", "TAOUSDT",
  "OMUSDT", "NOTUSDT", "IOUSDT", "ZKUSDT", "LISTAUSDT",
  "BANANAUSDT", "RENDERUSDT", "TONUSDT", "PEOPLEUSDT", "LSKUSDT",
  "CKBUSDT", "ARUSDT", "FXSUSDT", "SSUSDT", "AXLUSDT",
  "MEMEUSDT", "NFPUSDT", "ACEUSDT", "MOVRUSDT", "BEAMUSDT",
  "VANRYUSDT", "BOMEUSDT", "ENAUSDT", "WUSDT", "BBUSDT",
  "IOTXUSDT", "ASTRUSDT", "RIFUSDT", "QUICKUSDT", "MDTUSDT",
  "FORTHUSDT", "BONDUSDT", "GHSTUSDT", "PROSUSDT", "ELFUSDT",
  "FIDAUSDT", "GLMUSDT", "CLVUSDT", "VETUSDT", "STGUSDT",
  "JASMYUSDT", "NKNUSDT", "GTCUSDT", "KNCUSDT", "SNXUSDT",
  "CHRUSDT", "HFTUSDT", "PHAUSDT", "ACHUSDT", "OAXUSDT",
  "ACMUSDT", "ATAUSDT", "BTTCUSDT", "WINUSDT", "SUNUSDT",
  "JSTUSDT", "NULSUSDT", "ARDRUSDT", "WAXPUSDT", "SCUSDT",
  "STPTUSDT", "WTCUSDT", "DATAUSDT", "WRXUSDT", "COCOSUSDT",
  "DGBUSDT", "DCRUSDT", "RENUSDT", "CVCUSDT", "FUNUSDT",
  "QTUMUSDT", "NANOUSDT", "PAXGUSDT", "SXPUSDT", "SFPUSDT",
  "TFUELUSDT", "BELUSDT", "WINGUSDT", "UNFIUSDT", "REEFUSDT",
  "DEXEUSDT", "LAZOUSDT", "ALPINEUSDT", "PORTOUSDT", "SANTOSUSDT",
  "LZIOUSDT", "BARUSDT", "PYRUSDT", "RAREUSDT", "VOXELUSDT",
  "BETAUSDT", "EPXUSDT", "FLMUSDT", "MBLUSDT", "FARMUSDT",
  "DEGOUSDT", "ALCXUSDT", "TLMUSDT", "CVXUSDT", "MCUSDT",
  "FIROUSDT", "HARDUSDT", "TRIBEUSDT", "PUNDIXUSDT", "ERNUSDT",
  "MULTIUSDT", "VITEUSDT", "KDAUSDT", "XNOUSDT", "THETAUSDT",
] as const;

export const TDS_RATE = 0.01;
export const EXCHANGE_FEE_RATE = 0.002;

export const ADMIN_BANK_DETAILS = {
  bankName: "To be configured",
  accountNumber: "To be configured",
  ifscCode: "To be configured",
  accountHolder: "Kuznex Pvt Ltd",
  upiId: "To be configured",
};
