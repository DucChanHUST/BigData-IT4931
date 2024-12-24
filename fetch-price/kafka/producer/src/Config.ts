import { ethers } from "ethers";

export const MONGO_URL = "mongodb://localhost:27017";
export const DB_NAME = "bigdata-db";
export const DB_USERNAME = "";
export const DB_PASSWORD = "";

export const COINGECKO_IDS = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "dogecoin",
  "shiba-inu",
  "wrapped-bitcoin",
  "weth",
  "pepe",
];

export interface IToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  coingeckoId: string;
}

export const NATIVE_TOKENS: { [key: number]: IToken } = {
  1: {
    chainId: 1,
    address: "0x0000000000000000000000000000000000000000",
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  56: {
    chainId: 56,
    address: "0x0000000000000000000000000000000000000000",
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
    coingeckoId: "bitcoin",
  },
};

export const TOKEN_INFO: IToken[] = [
  {
    chainId: 1,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    coingeckoId: "weth",
  },
  {
    chainId: 1,
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    name: "SHIBA INU",
    symbol: "SHIB",
    decimals: 18,
    coingeckoId: "shiba-inu",
  },
  {
    chainId: 1,
    address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    name: "Pepe",
    symbol: "PEPE",
    decimals: 18,
    coingeckoId: "pepe",
  },
  {
    chainId: 1,
    address: "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
    coingeckoId: "binancecoin",
  },
  {
    chainId: 1,
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    name: "Wrapped BTC",
    symbol: "WBTC",
    decimals: 8,
    coingeckoId: "wrapped-bitcoin",
  },
  {
    chainId: 1,
    address: "0x4206931337dc273a630d328dA6441786BfaD668f",
    name: "Dogecoin",
    symbol: "DOGE",
    decimals: 8,
    coingeckoId: "dogecoin",
  },
  {
    chainId: 56,
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    name: "Wrapped BNB",
    symbol: "WBNB",
    decimals: 18,
    coingeckoId: "wbnb",
  },
  {
    chainId: 56,
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    name: "Ethereum Token",
    symbol: "ETH",
    decimals: 18,
    coingeckoId: "ethereum",
  },
];

const ethereumProvider = new ethers.providers.JsonRpcProvider(
  "https://eth.llamarpc.com"
);
const bscProvider = new ethers.providers.JsonRpcProvider(
  "https://binance.llamarpc.com"
);

export interface INetwork {
  chainId: number;
  providers: ethers.providers.JsonRpcProvider[];
  secondPerBlock: number;
  batchSize: number;
  initBlock: number;
}

export const NETWORKS: { [key: number]: INetwork } = {
  1: {
    chainId: 1,
    providers: [ethereumProvider],
    secondPerBlock: 12,
    batchSize: 14400, // 2 days
    initBlock: 19993250,
  },
  56: {
    chainId: 56,
    providers: [bscProvider],
    secondPerBlock: 3,
    batchSize: 43200, // 2 days
    initBlock: 39217091,
  },
};
