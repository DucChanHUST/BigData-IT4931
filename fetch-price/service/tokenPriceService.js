import axios from "axios";
import { ethers } from "ethers";
import { MongoService } from "./mongo.js";
import { NETWORKS, TOKEN_INFO } from "../common/config.js";
import { TokenPrice, LastBlockQuery } from "../model/index.js";

export class TokenPriceService {
  constructor() {
    this.fetchPrice = this.fetchPrice.bind(this);
    this.saveTokenPrice = this.saveTokenPrice.bind(this);
    this.getBlockTimestamp = this.getBlockTimestamp.bind(this);
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

  async fetchPrice() {
    try {
      const mongoservice = new MongoService();
      TOKEN_INFO.forEach(async (token) => {
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
          const timestampTo = await this.getBlockTimestamp(
            provider,
            blockNumberTo
          );
          const timestampFrom = await this.getBlockTimestamp(
            provider,
            lastBlockQuery
          );
          const prices = await this.getTokenPriceAtTimeStamp(
            token.coingeckoId,
            timestampFrom,
            timestampTo
          );
          if (prices.length() == 0) {
            console.log("ko co j");
            return;
          }
          await this.saveTokenPrice(prices, token.chainId, token.address);
        } else {
          const batchCount = Math.ceil(blockGap / batchSize);
          for (let i = 0; i < batchCount; i++) {
            const fromBlock = lastBlockQuery + i * batchSize;
            const toBlock = Math.min(
              lastBlockQuery + (i + 1) * batchSize,
              blockNumberTo
            );

            const timestampTo = await this.getBlockTimestamp(provider, toBlock);
            const timestampFrom = await this.getBlockTimestamp(
              provider,
              fromBlock
            );
            const prices = await this.getTokenPriceAtTimeStamp(
              token.coingeckoId,
              timestampFrom,
              timestampTo
            );
            if (prices.length() == 0) {
              console.log("ko co j");
              return;
            }

            await this.saveTokenPrice(prices, token.chainId, token.address);
          }
        }
      });

      mongoservice.updateLastBlockQuery(token.chainId, blockNumberTo);
    } catch (error) {
      console.error("Error in fetchPrice", error);
    }
  }

  async saveTokenPrice(prices, chainId, tokenAddress) {
    prices.map(async (item) => {
      await TokenPrice.create({
        value: item[1],
        chainId: chainId,
        tokenAddress: tokenAddress,
        timestamp: item[0],
      });
    });
  }
}
