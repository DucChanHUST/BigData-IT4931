import mongoose from "mongoose";
import { LastBlockQuery, TokenPrice, TokenInfo } from "../model/index.js";
import {
  MONGO_URL,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  TOKEN_INFO,
} from "../common/config.js";

export class MongoService {
  constructor() {
    this.initDb = this.initDb.bind(this);
    this.connectMongo = this.connectMongo.bind(this);
    this.mongooseConnect = this.mongooseConnect.bind(this);
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
        throw new Error("Mongo connection error", error);
      });

      await this.mongooseConnect();
    } catch (error) {
      console.error("Error in connectMongo", error);
    }
  }

  async mongooseConnect() {
    await mongoose
      .connect(MONGO_URL, {
        keepAlive: true,
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
      await LastBlockQuery.findOneAndUpdate(
        { chainId: 1 },
        { value: 20000000, chainId: 1 },
        { upsert: true, new: true }
      );

      TOKEN_INFO.forEach(async (token) => {
        await TokenInfo.findOneAndUpdate(
          { chainId: token.chainId, address: token.address },
          token,
          { upsert: true, new: true }
        );
      });
    } catch (error) {
      console.error("Error in initDb", error);
    }
  }

  async updateLastBlockQuery(chainId, value) {
    try {
      await LastBlockQuery.findOneAndUpdate(
        { chainId },
        { value, chainId },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Error in updateLastBlockQuery", error);
    }
  }

  async updateTokenPrice(price, chainId, tokenAddress, timestamp) {
    try {
      await TokenPrice.create({
        value: price,
        chainId,
        tokenAddress,
        timestamp,
      });
    } catch (error) {
      console.error("Error in updateTokenPrice", error);
    }
  }
}
