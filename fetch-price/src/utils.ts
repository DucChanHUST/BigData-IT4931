import { INetwork } from "./common/Config";

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getBlockByTimestamp = async (
  network: INetwork,
  timestampSecond: number
) => {
  const secondPerBlock = network.secondPerBlock;
  const lastestBlock = await network.provider.getBlockNumber();
  const now = Math.floor(Date.now() / 1000);
  const distance = Math.floor((now - timestampSecond) / secondPerBlock);

  return lastestBlock - distance;
};

export const getBlockTimestamp = async (provider: any, blockNumber: number) => {
  try {
    const block = await provider.getBlock(blockNumber);
    return block.timestamp;
  } catch (error) {
    console.error("Error in getBlockTimestamp", error);
  }
};
