import { CrawlEvm } from "./CrawlEvm";
import { MongoService } from "./Mongo";
import { KafkaProducerService } from "./Producer";
import { TokenPriceService } from "./TokenPriceService";

const KAFKA_BROKERS = ["my-cluster-kafka-bootstrap.ducchan-kafka:9092"];
const TOPIC_TOKEN = "token";
const TOPIC_TX = "tx";

const producerToken = new KafkaProducerService(KAFKA_BROKERS, TOPIC_TOKEN);
const producerTx = new KafkaProducerService(KAFKA_BROKERS, TOPIC_TX);

const mongoService = new MongoService();
const tokenPriceService = new TokenPriceService(producerToken);
const crawlService = new CrawlEvm(producerTx);

const start = async () => {
  await mongoService.connectMongo();
  await mongoService.initDb();

  await producerToken.connect();

  // await tokenPriceService.fetchPrice();
  // await crawlService.crawlTx();

  await crawlService.crawlTx();
};

start();

process.on("SIGINT", async () => {
  await producerToken.disconnect();
  process.exit(0);
});
