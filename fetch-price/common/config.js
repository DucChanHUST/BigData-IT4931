import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config;

export const MONGO_URL = process.env.MONGO_URL ?? "mongodb://localhost:27017";
export const DB_NAME = process.env.DB_NAME ?? "bigdata-db";
export const DB_USERNAME = process.env.DB_USERNAME ?? "";
export const DB_PASSWORD = process.env.DB_PASSWORD ?? "";

export const TOKEN_INFO = [
  {
    chainId: 1,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    coingeckoId: "ethereum",
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
    address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    name: "Uniswap",
    symbol: "UNI",
    decimals: 18,
    coingeckoId: "uniswap",
  },
  {
    chainId: 1,
    address: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
    name: "Liquid staked Ether 2.0",
    symbol: "stETH",
    decimals: 18,
    coingeckoId: "staked-ether",
  },
  {
    chainId: 1,
    address: "0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4",
    name: "NEAR",
    symbol: "NEAR",
    decimals: 24,
    coingeckoId: "near",
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
    address: "0xD31a59c85aE9D8edEFeC411D448f90841571b89c",
    name: "Wrapped SOL",
    symbol: "SOL",
    decimals: 9,
    coingeckoId: "solana",
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
    chainId: 1,
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    name: "ChainLink Token",
    symbol: "LINK",
    decimals: 18,
    coingeckoId: "chainlink",
  },
];

const ethereumProvider = new ethers.providers.JsonRpcProvider(
  "https://eth.llamarpc.com"
);

export const NETWORKS = {
  1: {
    chainId: 1,
    provider: ethereumProvider,
    secondPerBlock: 12,
    // assume query price each 5minutes
    batchSize: 50,
  },
};
