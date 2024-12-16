import mongoose from "mongoose";

export interface ITransaction {
  txHash: string;
  txIndex?: number;
  logIndex?: number;
  chainId: number;
  tokenAddress: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  valueInUsd?: string;
}

const transactionSchema = new mongoose.Schema<ITransaction>(
  {
    txHash: { type: String, required: true },
    txIndex: { type: Number, required: false },
    logIndex: { type: Number, required: false },
    chainId: { type: Number, required: true },
    tokenAddress: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    timestamp: { type: Number, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    value: { type: String, required: true },
    valueInUsd: { type: String, required: false },
  },
  { versionKey: false }
);

export default mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema,
  "transaction"
);
