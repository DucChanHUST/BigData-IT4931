import mongoose from "mongoose";

export interface ITokenTotalVolume {
  _id: string; // coingeckoId + timestamp
  value: string;
  coingeckoId: string;
  timestamp: number;
}

const tokenTotalVolumeSchema = new mongoose.Schema<ITokenTotalVolume>(
  {
    _id: { type: String, required: true },
    value: { type: String, required: true },
    coingeckoId: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { versionKey: false }
);

export default mongoose.model(
  "TokenTotalVolume",
  tokenTotalVolumeSchema,
  "token_total_volume"
);
