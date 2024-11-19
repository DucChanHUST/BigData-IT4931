import mongoose from "mongoose";

const lastBlockQuerySchema = new mongoose.Schema(
  {
    value: Number,
    chainId: Number,
  },
  {
    versionKey: false,
  }
);

export default mongoose.model(
  "LastBlockQuery",
  lastBlockQuerySchema,
  "last_block_query"
);
