import { MongoClient } from "mongodb";
import { COINGECKO_IDS, NETWORKS } from "./Config";

const mongoUri = "mongodb://mongodb.ducchan-kafka.svc.cluster.local:27017";
const client = new MongoClient(mongoUri, {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});
const initDb = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("Connection URI:", mongoUri);

    await client.connect();
    console.log("Connected to MongoDB successfully");

    const db = client.db("bigdata-db");

    const lastTimeQueryCollection = db.collection("last-time-query");
    const lastBlockQueryCollection = db.collection("last-block-query");

    for (const coingeckoId of COINGECKO_IDS) {
      await lastTimeQueryCollection.updateOne(
        { coingeckoId },
        { $setOnInsert: { coingeckoId, timestamp: 1717200000 } },
        { upsert: true }
      );
      console.log("Inserted Coingecko ID:", coingeckoId);
    }

    for (const network of Object.values(NETWORKS)) {
      const chainId = network.chainId;
      const initBlock = network.initBlock;
      await lastBlockQueryCollection.updateOne(
        { chainId },
        { $setOnInsert: { chainId, blockNumber: initBlock } },
        { upsert: true }
      );
      console.log("Inserted Network:", network);
    }

    console.log("Database initialization complete.");
  } catch (error: any) {
    console.error("Detailed MongoDB Connection Error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  } finally {
    await client.close();
  }
};

initDb();
