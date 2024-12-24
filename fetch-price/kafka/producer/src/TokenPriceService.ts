import axios from "axios";

import { sleep } from "./utils";
import { MongoService } from "./Mongo";
import {
  LastTimeQuery,
  TokenMarketCap,
  TokenPrice,
  TokenTotalVolume,
} from "./model";
import { COINGECKO_IDS } from "./Config";
import { KafkaProducerService } from "./Producer";

const maxBatchSize = 60 * 24 * 60 * 60;
const minBatchSize = 3 * 24 * 60 * 60;

export class TokenPriceService {
  private producer: KafkaProducerService;

  constructor(producer: KafkaProducerService) {
    this.producer = producer;
    this.fetchPrice = this.fetchPrice.bind(this);
    this.fetchPriceAtTimeStamp = this.fetchPriceAtTimeStamp.bind(this);
  }

  async fetchPriceAtTimeStamp(
    coingeckoId: string,
    timestampFrom: number,
    timestampTo: number
  ) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart/range?vs_currency=usd&from=${timestampFrom}&to=${timestampTo}`;
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

      const updatePromises: Promise<any>[] = [];

      for (let i = 0; i < prices.length; i++) {
        const timestamp = Math.round(prices[i][0] / 1000);
        // const timestamp = Math.round(prices[i][0] / 3600000) * 3600;
        const price = prices[i][1];
        const market_cap = market_caps[i][1];
        const total_volume = total_volumes[i][1];

        updatePromises.push(
          // TokenPrice.updateTokenPrice(price, coingeckoId, timestamp)
          TokenPrice.create({
            _id: `${coingeckoId}_${timestamp}`.toString(),
            value: price.toString(),
            coingeckoId: coingeckoId,
            timestamp: timestamp,
          })
        );

        await TokenPrice.create();
        updatePromises.push(
          TokenMarketCap.create({
            _id: `${coingeckoId}_${timestamp}`,
            value: market_cap,
            coingeckoId,
            timestamp,
          })
          // mongoService.updateTokenMarketCap(market_cap, coingeckoId, timestamp)
        );
        updatePromises.push(
          TokenTotalVolume.create({
            _id: `${coingeckoId}_${timestamp}`,
            value: total_volume,
            coingeckoId,
            timestamp,
          })
        );
        // mongoService.updateTokenTotalVolume(
        //   total_volume,
        //   coingeckoId,
        //   timestamp
        // )
      }
      await Promise.all(updatePromises);
      // await mongoService.updateLastTimeQuery(coingeckoId, timestampTo);
      const updatedRecord = await LastTimeQuery.findOneAndUpdate(
        { _id: coingeckoId },
        {
          _id: coingeckoId,
          timestamp: timestampTo,
        },
        { upsert: true, new: true }
      );
      console.log("update last time query", coingeckoId, timestampTo);
      await sleep(25000);
    } catch (error: any) {
      console.error("Error in fetchPriceAtTimeStamp", error.code);
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
          await this.fetchPriceAtTimeStamp(
            coingeckoId,
            lastTimeQuery,
            lastTimeQuery + maxBatchSize
          );
          lastTimeQuery += maxBatchSize;
          timeGap -= maxBatchSize;
          sleep(10000);
          console.log("sleep");
        }

        if (timeGap > minBatchSize) {
          await this.fetchPriceAtTimeStamp(coingeckoId, lastTimeQuery, now);
        }
        console.log("fetch token", coingeckoId, "done");
      }

      console.log("fetch all tokens done");
    } catch (error) {
      console.error("Error in fetchPrice", error);
      process.exit(1);
    }
  }

  async simpleLog() {
    try {
      for (const coingeckoId of COINGECKO_IDS) {
        const lastTimeQueryRecord = await LastTimeQuery.findOne({
          _id: coingeckoId,
        });

        console.log("fetch token", coingeckoId);
        console.log("Last time query", lastTimeQueryRecord);
        const updatedRecord = await LastTimeQuery.findOneAndUpdate(
          { _id: coingeckoId },
          {
            _id: coingeckoId,
            timestamp: "1717200100",
          },
          { upsert: true, new: true } // upsert: true để tạo mới nếu không tồn tại
        );

        console.log(updatedRecord);
      }

      console.log("fetch all tokens done");
    } catch (error) {
      console.error("Error in fetchPrice", error);
      process.exit(1);
    }
  }
}
