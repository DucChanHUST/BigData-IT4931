import { CrawlEvm } from "./CrawlEvm";
import { MongoService } from "./Mongo";
import { KafkaProducerService } from "./Producer";
import { TokenPriceService } from "./TokenPriceService";

const KAFKA_BROKERS = ["localhost:29092"];
const TOPIC_TOKEN = "codespotify-topic";

const TOPIC_TX = "tx";

const producerToken = new KafkaProducerService(KAFKA_BROKERS, TOPIC_TOKEN);
// const producerTx = new KafkaProducerService(KAFKA_BROKERS, TOPIC_TX);

const mongoService = new MongoService();
const tokenPriceService = new TokenPriceService(producerToken);
const crawlService = new CrawlEvm(producerToken);

const start = async () => {
  await mongoService.connectMongo();
  await mongoService.initDb();

  await producerToken.connect();

  // await crawlService.simpleLog();

  // await tokenPriceService.fetchPrice();
  // await tokenPriceService.simpleLog();
  await crawlService.crawlTx();

  // await crawlService.crawlTx();
};

start();

process.on("SIGINT", async () => {
  await producerToken.disconnect();
  process.exit(0);
});
