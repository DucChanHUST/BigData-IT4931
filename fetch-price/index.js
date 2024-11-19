import axios from "axios";
import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider(
  "https://eth.llamarpc.com"
);

const getBlockTimestamp = async (blockNumber) => {
  try {
    const block = await provider.getBlock(blockNumber);
    return block.timestamp;
  } catch (error) {
    console.error("Error in getBlockTimestamp", error);
  }
};

const getTokenPriceAtTimeStamp = async (
  tokenId,
  timestampFrom,
  timestampTo
) => {
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
};

const fetchPrice = async () => {
  try {
    const tokenId = "ethereum";
    const blockNumberTo = await provider.getBlockNumber();
    console.log("blockNumberTo", blockNumberTo);

    const blockNumberFrom = blockNumberTo - 50;
    console.log("blockNumberFrom", blockNumberFrom);

    const timestampTo = await getBlockTimestamp(blockNumberTo);
    console.log("timestampTo", timestampTo);

    const timestampFrom = await getBlockTimestamp(blockNumberFrom);
    console.log("timestampFrom", timestampFrom);

    const prices = await getTokenPriceAtTimeStamp(
      tokenId,
      // timestampFrom,
      timestampTo,
      timestampTo
    );
    console.log(prices);
  } catch (error) {
    console.error("Error in fetchPrice", error);
  }
};

fetchPrice();
