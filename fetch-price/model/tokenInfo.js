import mongoose from "mongoose";

const tokenInfoSchema = new mongoose.Schema(
  {
    chainId: Number,
    address: String,
    name: String,
    symbol: String,
    decimals: Number,
    coingeckoId: String,
  },
  {
    versionKey: false,
  }
);

export default mongoose.model("TokenInfo", tokenInfoSchema, "token_info");
