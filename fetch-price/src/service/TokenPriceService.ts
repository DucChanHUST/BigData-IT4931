import axios from "axios";

import { sleep } from "../utils";
import { MongoService } from "./Mongo";
import { LastTimeQuery } from "../model/index";
import { COINGECKO_IDS } from "../common/Config";

const maxBatchSize = 30 * 24 * 60 * 60;
const minBatchSize = 3 * 24 * 60 * 60;
const mongoService = new MongoService();

export class TokenPriceService {
  constructor() {
    this.fetchPrice = this.fetchPrice.bind(this);
    this.getTokenPriceAtTimeStamp = this.getTokenPriceAtTimeStamp.bind(this);
  }

  async getTokenPriceAtTimeStamp(
    coingeckoId: string,
    timestampFrom: number,
    timestampTo: number
  ) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart/range?vs_currency=usd&from=${timestampFrom}&to=${timestampTo}`;
      console.log("url", url);

      const response = await axios.get(url);
      if (
        !response.data ||
        !response.data.prices ||
        !response.data.market_caps ||
        !response.data.total_volumes
      ) {
        throw new Error("Incomplete data received from API");
      }

      const prices = response.data.prices;
      const market_caps = response.data.market_caps;
      const total_volumes = response.data.total_volumes;

      if (prices.length === 0) {
        throw new Error("No price data found");
      }
      console.log("length", prices.length);

      const updatePromises: Promise<void>[] = [];

      for (let i = 0; i < prices.length; i++) {
        const timestamp = Math.floor(prices[i][0] / 1000);
        const price = prices[i][1];
        const market_cap = market_caps[i][1];
        const total_volume = total_volumes[i][1];

        updatePromises.push(
          mongoService.updateTokenPrice(price, coingeckoId, timestamp)
        );
        updatePromises.push(
          mongoService.updateTokenMarketCap(market_cap, coingeckoId, timestamp)
        );
        updatePromises.push(
          mongoService.updateTokenTotalVolume(
            total_volume,
            coingeckoId,
            timestamp
          )
        );
      }
      await Promise.all(updatePromises);
      await mongoService.updateLastTimeQuery(coingeckoId, timestampTo);
      console.log("update last time query", coingeckoId, timestampTo);
      await sleep(25000);
    } catch (error) {
      console.error("Error in getTokenPriceAtTimeStamp", error);
      process.exit(1);
    }
  }

  async fetchPrice() {
    try {
      for (const coingeckoId of COINGECKO_IDS) {
        console.log("fetch token", coingeckoId);

        const lastTimeQueryRecord = await LastTimeQuery.findOne({
          _id: coingeckoId,
        });

        if (!lastTimeQueryRecord || !lastTimeQueryRecord.timestamp) {
          throw new Error("No last time query found");
        }

        const now = Math.floor(Date.now() / 1000);
        let lastTimeQuery = lastTimeQueryRecord.timestamp;
        let timeGap = now - lastTimeQuery;

        while (timeGap > maxBatchSize) {
          await this.getTokenPriceAtTimeStamp(
            coingeckoId,
            lastTimeQuery,
            lastTimeQuery + maxBatchSize
          );
          lastTimeQuery += maxBatchSize;
          timeGap -= maxBatchSize;
        }

        if (timeGap > minBatchSize) {
          await this.getTokenPriceAtTimeStamp(coingeckoId, lastTimeQuery, now);
        }
        console.log("fetch token", coingeckoId, "done");
      }
    } catch (error) {
      console.error("Error in fetchPrice", error);
      process.exit(1);
    }
  }
}
