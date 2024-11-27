import axios from "axios";
import { MongoService } from "./mongo.js";
import { LastBlockQuery } from "../model/index.js";
import { NETWORKS, TOKEN_INFO } from "../common/config.js";

export class TokenPriceService {
  constructor() {
    this.fetchPrice = this.fetchPrice.bind(this);
    this.getBlockTimestamp = this.getBlockTimestamp.bind(this);
    this.fetchPriceForBlockRange = this.fetchPriceForBlockRange.bind(this);
    this.getTokenPriceAtTimeStamp = this.getTokenPriceAtTimeStamp.bind(this);
  }

  async getBlockTimestamp(provider, blockNumber) {
    try {
      const block = await provider.getBlock(blockNumber);
      return block.timestamp;
    } catch (error) {
      console.error("Error in getBlockTimestamp", error);
    }
  }

  async getTokenPriceAtTimeStamp(tokenId, timestampFrom, timestampTo) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart/range?vs_currency=usd&from=${timestampFrom}&to=${timestampTo}`;

      const response = await axios.get(url);
      if (!response.data || !response.data.prices) {
        throw new Error("No data found");
      }

      return response.data.prices;
    } catch (error) {
      console.error("Error in getTokenPriceAtTimeStamp", error);
    }
  }

  async fetchPriceForBlockRange(
    token,
    provider,
    blockNumberFrom,
    blockNumberTo
  ) {
    try {
      console.log("from block", blockNumberFrom, "to block", blockNumberTo);
      new Promise((resolve) => setTimeout(resolve, 15000)); // sleep

      const sIn5Minutes = 5 * 60;
      const msIn5Minutes = 5 * 60 * 1000;
      const mongoService = new MongoService();

      const timestampTo = await this.getBlockTimestamp(provider, blockNumberTo);
      const timestampFrom = await this.getBlockTimestamp(
        provider,
        blockNumberFrom
      );
      console.log("from timestamp", timestampFrom, "to timestamp", timestampTo);

      const prices = await this.getTokenPriceAtTimeStamp(
        token.coingeckoId,
        timestampFrom,
        timestampTo
      );

      prices.map(async (price) => {
        const timestamp = Math.round(price[0] / msIn5Minutes) * sIn5Minutes;

        await mongoService.updateTokenPrice(
          price[1],
          token.chainId,
          token.address,
          timestamp
        );
      });
    } catch (error) {
      console.error("Error in fetchPriceForBlockRange", error);
    }
  }

  async fetchPrice() {
    try {
      const mongoService = new MongoService();
      TOKEN_INFO.forEach(async (token) => {
        console.log("fetch token", token.symbol);

        const network = NETWORKS[token.chainId];
        const provider = network.provider;

        const blockNumberTo = await network.provider.getBlockNumber();
        const lastBlockQueryRecord = await LastBlockQuery.findOne({
          chainId: network.chainId,
        }).select("value -_id");

        const lastBlockQuery = lastBlockQueryRecord.value;
        const blockGap = blockNumberTo - lastBlockQuery;

        const batchSize = network.batchSize;
        if (blockGap < batchSize) {
          this.fetchPriceForBlockRange(
            token,
            provider,
            lastBlockQuery,
            blockNumberTo
          );
        } else {
          const batchCount = Math.ceil(blockGap / batchSize);
          for (let i = 0; i < batchCount; i++) {
            const fromBlock = lastBlockQuery + i * batchSize;
            const toBlock = Math.min(
              lastBlockQuery + (i + 1) * batchSize,
              blockNumberTo
            );
            this.fetchPriceForBlockRange(token, provider, fromBlock, toBlock);
          }
        }

        console.log("update last block query", blockNumberTo);

        mongoService.updateLastBlockQuery(token.chainId, blockNumberTo);
      });
    } catch (error) {
      console.error("Error in fetchPrice", error);
    }
  }
}
