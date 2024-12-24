import { ethers } from "ethers";
import { sleep } from "./utils";
import { MongoService } from "./Mongo";
import { ITransaction } from "./model";
import { KafkaProducerService } from "./Producer";
import { NETWORKS, NATIVE_TOKENS, TOKEN_INFO } from "./Config";

const mongoService = new MongoService();

export class CrawlEvm {
  private producer: KafkaProducerService;

  constructor(producer: KafkaProducerService) {
    this.producer = producer;
    this.decodeBlock = this.decodeBlock.bind(this);
  }

  async decodeBlock(chainId: number, blockNumber: number) {
    const network = NETWORKS[chainId];
    const providers = network.providers;
    const providerLength = providers.length;

    let attempt = 0;
    // while (true) {
    const provider = providers[attempt % providerLength];
    try {
      sleep(5000);
      const block = await provider.getBlockWithTransactions(blockNumber);
      const timestamp = block.timestamp;
      const transactions = block.transactions;

      for (const transaction of transactions) {
        const valueNativeToken = ethers.utils.formatUnits(
          transaction.value,
          NATIVE_TOKENS[chainId].decimals
        );

        if (valueNativeToken != "0.0") {
          const transactionRecord: ITransaction = {
            txHash: transaction.hash,
            chainId: chainId,
            tokenAddress: "0x0000000000000000000000000000000000000000",
            blockNumber: blockNumber,
            timestamp: timestamp,
            from: transaction.from,
            to: transaction.to || "",
            value: valueNativeToken,
          };
          // console.log("Native: ", transactionRecord);
          this.producer.sendMessage({
            txHash: transaction.hash,
            chainId: chainId,
            tokenAddress: "0x0000000000000000000000000000000000000000",
            blockNumber: blockNumber,
            timestamp: timestamp,
            from: transaction.from,
            to: transaction.to || "",
            value: valueNativeToken,
          });
          // await mongoService.saveTransaction(transactionRecord);
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
          const tokenInfo = TOKEN_INFO.find(
            (token) => token.address === tokenAddress
          );

          if (tokenInfo) {
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
            // console.log("Token: ", transactionRecord);
            this.producer.sendMessage({
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
            });
            await mongoService.saveTransaction(transactionRecord);
            continue;
          }
          // await mongoService.saveTransaction(transactionRecord);
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
    // }
  }

  async crawlTx() {
    const networks = Object.values(NETWORKS);
    while (true) {
      for (const network of networks) {
        const lastBlockQuery = await mongoService.getLastBlockQuery(
          network.chainId
        );
        this.decodeBlock(network.chainId, lastBlockQuery);
        mongoService.updateLastBlockQuery(
          network.chainId,
          Number(lastBlockQuery) + 1
        );
      }
    }
  }

  async simpleLog() {
    while (true) {
      console.log("send message");

      await this.producer.sendMessage({
        message: "Hello",
      });
      await sleep(10000);
    }
  }
}

const getAddresFromTopic = (topic: string) => {
  return `0x${topic.slice(-40)}`;
};
