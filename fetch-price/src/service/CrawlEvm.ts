import { ethers } from "ethers";
import { sleep } from "../utils";
import { MongoService } from "./Mongo";
import { ITransaction } from "../model";
import { TokenPriceService } from "./TokenPriceService";
import { NETWORKS, NATIVE_TOKENS, TOKEN_INFO } from "../common/Config";

const mongoService = new MongoService();
const tokenPriceService = new TokenPriceService();

export class CrawlEvm {
  constructor() {}

  async decodeBlock(chainId: number, blockNumber: number) {
    const network = NETWORKS[chainId];
    const providers = network.providers;
    const providerLength = providers.length;

    let attempt = 0;
    while (true) {
      const provider = providers[attempt % providerLength];
      try {
        sleep(3000);
        const block = await provider.getBlockWithTransactions(blockNumber);
        console.log("block", blockNumber);

        const timestamp = block.timestamp;
        const transactions = block.transactions;

        for (const transaction of transactions) {
          const valueNativeToken = ethers.utils.formatUnits(
            transaction.value,
            NATIVE_TOKENS[chainId].decimals
          );

          if (valueNativeToken != "0.0") {
            const valueNativeTokenFloat = parseFloat(valueNativeToken);
            const tokenPrice = await tokenPriceService.getTokenPrice(
              NATIVE_TOKENS[chainId].coingeckoId,
              timestamp
            );
            const valueInUsd = valueNativeTokenFloat * tokenPrice;
            const transactionRecord: ITransaction = {
              txHash: transaction.hash,
              chainId: chainId,
              tokenAddress: "0x0000000000000000000000000000000000000000",
              blockNumber: blockNumber,
              timestamp: timestamp,
              from: transaction.from,
              to: transaction.to || "",
              value: valueNativeToken,
              valueInUsd: valueInUsd.toString(),
            };

            await mongoService.saveTransaction(transactionRecord);
          }

          const txReceipt = await provider.getTransactionReceipt(
            transaction.hash
          );

          const logs = txReceipt.logs;
          if (!logs.length) {
            continue;
          }

          for (const log of logs) {
            // check if the log is a token transfer
            if (log.topics.length !== 3) {
              continue;
            }

            const topicEvent = log.topics[0];
            if (
              topicEvent !==
              "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            ) {
              continue;
            }

            const tokenAddress = log.address;
            const value = ethers.utils.formatUnits(log.data);
            const transactionRecord: ITransaction = {
              txHash: log.transactionHash,
              txIndex: log.transactionIndex,
              logIndex: log.logIndex,
              chainId: chainId,
              tokenAddress: tokenAddress,
              blockNumber: log.blockNumber,
              timestamp: timestamp,
              from: getAddresFromTopic(log.topics[1]),
              to: getAddresFromTopic(log.topics[2]),
              value: value,
            };

            const tokenInfo = TOKEN_INFO.find(
              (token) => token.address === tokenAddress
            );

            if (!tokenInfo) {
              await mongoService.saveTransaction(transactionRecord);
              continue;
            }

            const tokenPrice = await tokenPriceService.getTokenPrice(
              tokenInfo.coingeckoId,
              timestamp
            );
            const decimalGap = 18 - tokenInfo.decimals;
            const valueInUsd =
              parseFloat(value) * Math.pow(10, decimalGap) * tokenPrice;
            transactionRecord.valueInUsd = valueInUsd.toString();
            await mongoService.saveTransaction(transactionRecord);
          }
        }
      } catch (error) {
        console.error(`Provider ${(attempt % providers.length) + 1} failed`);
        attempt++;

        if (attempt >= providerLength * 2) {
          console.error("All providers failed");
          await sleep(10000);
        }
      }
    }
  }
}

const getAddresFromTopic = (topic: string) => {
  return `0x${topic.slice(-40)}`;
};
