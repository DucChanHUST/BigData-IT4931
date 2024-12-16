import { MongoService } from "./Mongo";
import { KafkaProducerService } from "./Producer";
import { TokenPriceService } from "./TokenPriceService";

const KAFKA_BROKERS = ["my-cluster-kafka-bootstrap.ducchan-kafka:9092"];
const TOPIC_TOKEN = "token";

const producerToken = new KafkaProducerService(KAFKA_BROKERS, TOPIC_TOKEN);
const mongoService = new MongoService();
const tokenPriceService = new TokenPriceService(producerToken);

const start = async () => {
  await mongoService.connectMongo();
  await mongoService.initDb();

  await producerToken.connect();

  await tokenPriceService.fetchPrice();
};

start();

process.on("SIGINT", async () => {
  await producerToken.disconnect();
  process.exit(0);
});
