import mongoose from "mongoose";

export interface ITokenMarketCap {
  _id: string;
  value: string;
  coingeckoId: string;
  timestamp: number;
}

const tokenMarketCapSchema = new mongoose.Schema<ITokenMarketCap>(
  {
    _id: { type: String, required: true },
    value: { type: String, required: true },
    coingeckoId: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { versionKey: false }
);

export default mongoose.model(
  "TokenMarketCap",
  tokenMarketCapSchema,
  "token_market_cap"
);
