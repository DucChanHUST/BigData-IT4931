import dotenv from "dotenv";
import { CrawlEvm } from "./CrawlEvm";
import { MongoService } from "./Mongo";
import { KafkaProducerService } from "./Producer";
import { TokenPriceService } from "./TokenPriceService";

dotenv.config()

const brokers: string[] = [
  'kafka-broker1:9092', 
  'kafka-broker2:9092'
]
const KAFKA_BROKERS = process.env.KAFKA_BOOTSTRAP_SERVERS 
? process.env.KAFKA_BOOTSTRAP_SERVERS.split(',') 
: brokers;
const TOPIC_TOKEN = "token";
const TOPIC_TX = "tx";

const producerToken = new KafkaProducerService(KAFKA_BROKERS, TOPIC_TOKEN);
const producerTx = new KafkaProducerService(KAFKA_BROKERS, TOPIC_TX);

const mongoService = new MongoService();
const tokenPriceService = new TokenPriceService(producerToken);
const crawlService = new CrawlEvm(producerToken);

const start = async () => {
  await mongoService.connectMongo();
  await mongoService.initDb();

  await producerToken.connect();

  // await tokenPriceService.fetchPrice();
  // await crawlService.crawlTx();
  console.log("Broker", KAFKA_BROKERS);

  await crawlService.test();
};

start();

process.on("SIGINT", async () => {
  await producerToken.disconnect();
  process.exit(0);
});
