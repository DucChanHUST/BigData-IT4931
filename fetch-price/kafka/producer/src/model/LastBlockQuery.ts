import mongoose from "mongoose";

export interface ILastBlockQuery {
  _id: string; // chainId
  blockNumber: number;
}

const lastBlockQuerySchema = new mongoose.Schema<ILastBlockQuery>(
  {
    _id: { type: String, required: true },
    blockNumber: { type: Number, required: true },
  },
  { versionKey: false }
);

export default mongoose.model<ILastBlockQuery>(
  "LastBlockQuery",
  lastBlockQuerySchema,
  "last_block_query"
);
