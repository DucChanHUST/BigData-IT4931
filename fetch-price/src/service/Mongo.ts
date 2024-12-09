import mongoose from "mongoose";

import {
  TokenPrice,
  Transaction,
  LastTimeQuery,
  TokenMarketCap,
  LastBlockQuery,
  TokenTotalVolume,
  ITransaction,
} from "../model";
import {
  MONGO_URL,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  COINGECKO_IDS,
  NETWORKS,
} from "../common/Config";

export class MongoService {
  constructor() {
    this.initDb = this.initDb.bind(this);
    this.connectMongo = this.connectMongo.bind(this);
    this.mongooseConnect = this.mongooseConnect.bind(this);
    this.updateTokenPrice = this.updateTokenPrice.bind(this);
    this.updateLastTimeQuery = this.updateLastTimeQuery.bind(this);
  }

  async connectMongo() {
    try {
      const connection = mongoose.connection;
      connection.on("connected", () => {
        console.log("Mongo Connection Established");
      });
      connection.on("reconnect", () => {
        console.log("Mongo Connection Reestablished");
      });
      connection.on("disconnected", () => {
        console.log("Mongo Connection Disconnected");
        console.log("Trying to reconnect to Mongo ...");
        setTimeout(async () => {
          await this.mongooseConnect();
        }, 10000);
      });
      connection.on("close", () => {
        console.log("Mongo Connection Closed");
      });
      connection.on("error", (error) => {
        throw new Error(`Mongo connection error: ${error}`);
      });

      await this.mongooseConnect();
    } catch (error) {
      console.error("Error in connectMongo", error);
    }
  }

  async mongooseConnect() {
    await mongoose
      .connect(MONGO_URL, {
        dbName: DB_NAME,
        user: DB_USERNAME,
        pass: DB_PASSWORD,
        autoCreate: true,
        autoIndex: true,
      })
      .catch((error) => {
        console.error("Error in mongooseConnect", error);
      });
  }

  async initDb() {
    try {
      // TOKEN_INFO.forEach(async (token) => {
      //   const chainId = token.chainId;
      //   const tokenAddress = token.address;

      //   await TokenInfo.findOneAndUpdate(
      //     { chainId: chainId, address: tokenAddress },
      //     token,
      //     { upsert: true, new: true }
      //   );
      // });

      for (const coingeckoId of COINGECKO_IDS) {
        const _id = coingeckoId;
        await LastTimeQuery.updateOne(
          { _id },
          { $setOnInsert: { _id, timestamp: 1717200000 } }, // Date and time (GMT): Saturday, June 1, 2024 12:00:00 AM
          { upsert: true }
        );
      }

      for (const network of Object.values(NETWORKS)) {
        const _id = network.chainId;
        const initBlock = network.initBlock;
        await LastBlockQuery.updateOne(
          { _id },
          { $setOnInsert: { _id, blockNumber: initBlock } },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("Error in initDb", error);
    }
  }

  async updateLastTimeQuery(coingeckoId: string, timestamp: number) {
    try {
      await LastTimeQuery.findOneAndUpdate(
        { _id: coingeckoId },
        { timestamp },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Error in updateLastTimeQuery", error);
    }
  }

  async updateTokenPrice(
    value: number,
    coingeckoId: string,
    timestamp: number
  ) {
    try {
      await TokenPrice.create({
        _id: `${coingeckoId}_${timestamp}`,
        value,
        coingeckoId,
        timestamp,
      });
    } catch (error) {
      console.error("Error in updateTokenPrice", error);
    }
  }

  async updateTokenMarketCap(
    value: number,
    coingeckoId: string,
    timestamp: number
  ) {
    try {
      await TokenMarketCap.create({
        _id: `${coingeckoId}_${timestamp}`,
        value,
        coingeckoId,
        timestamp,
      });
    } catch (error) {
      console.error("Error in updateTokenMarketCaps", error);
    }
  }

  async updateTokenTotalVolume(
    value: number,
    coingeckoId: string,
    timestamp: number
  ) {
    try {
      await TokenTotalVolume.create({
        _id: `${coingeckoId}_${timestamp}`,
        value,
        coingeckoId,
        timestamp,
      });
    } catch (error) {
      console.error("Error in updateTokenTotalVolumes", error);
    }
  }

  async updateLastBlockQuery(chainId: number, blockNumber: number) {
    try {
      await LastBlockQuery.findOneAndUpdate(
        { _id: chainId },
        { blockNumber },
        { upsert: true }
      );
    } catch (error) {
      console.error("Error in updateLastBlockQuery", error);
    }
  }

  async saveTransaction(transaction: ITransaction) {
    try {
      await Transaction.create(transaction);
    } catch (error) {
      console.error("Error in saveTransaction", error);
    }
  }
}
