import mongoose from "mongoose";

export interface ITokenPrice {
  _id: string; // coingeckoId + timestamp
  value: string;
  coingeckoId: string;
  timestamp: number;
}

const tokenPriceSchema = new mongoose.Schema<ITokenPrice>(
  {
    _id: { type: String, required: true },
    value: { type: String, required: true },
    coingeckoId: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { versionKey: false }
);

export default mongoose.model("TokenPrice", tokenPriceSchema, "token_price");
