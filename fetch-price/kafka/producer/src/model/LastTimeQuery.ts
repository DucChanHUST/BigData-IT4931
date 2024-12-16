import mongoose from "mongoose";

export interface ILastTimeQuery {
  _id: string; // coinGeckoId
  timestamp: number;
}

const lastTimeQuerySchema = new mongoose.Schema<ILastTimeQuery>(
  {
    _id: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { versionKey: false }
);

export default mongoose.model<ILastTimeQuery>(
  "LastTimeQuery",
  lastTimeQuerySchema,
  "last_time_query"
);
