import mongoose from "mongoose";

export interface ITokenInfo {
  _id: string; // chainId + address
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  coingeckoId: string;
}

const tokenInfoSchema = new mongoose.Schema<ITokenInfo>(
  {
    _id: { type: String, required: true },
    chainId: Number,
    address: String,
    name: String,
    symbol: String,
    decimals: Number,
    coingeckoId: String,
  },
  { versionKey: false }
);

export default mongoose.model("TokenInfo", tokenInfoSchema, "token_info");
