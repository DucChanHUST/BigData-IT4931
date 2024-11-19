import mongoose from "mongoose";

const tokenPriceSchema = new mongoose.Schema(
  {
    value: String,
    chainId: Number,
    tokenAddress: String,
    timestamp: Number,
  },
  { versionKey: false }
);

export default mongoose.model("TokenPrice", tokenPriceSchema, "token_price");
