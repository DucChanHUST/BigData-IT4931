import dotenv from "dotenv";
import { Kafka, Consumer } from "kafkajs";

dotenv.config()

class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(brokers: string[], groupId: string) {
    this.kafka = new Kafka({
      clientId: "multi-topic-consumer",
      brokers: brokers,
    });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    console.log("Consumer connected successfully");
  }

  async subscribeToTopics(topics: string[]): Promise<void> {
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: true });
    }
    console.log(`Subscribed to topics: ${topics.join(", ")}`);
  }

  async consume(): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const data = JSON.parse(message.value?.toString() || "{}");
        if (topic === "token") {
          console.log("Token message:", data);
        } else if (topic === "tx") {
          console.log("Tx message:", data);
        } else {
          console.warn(`Unknown topic "${topic}" with data:`, data);
        }
      },
    });
  }

  async start() {
    await this.connect();
    await this.subscribeToTopics(["token", "tx"]);
    await this.consume();
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
    console.log("Consumer disconnected");
  }
}

const brokers: string[] = [
  'kafka-broker1:9092', 
  'kafka-broker2:9092'
]
const KAFKA_BROKERS = process.env.KAFKA_BOOTSTRAP_SERVERS 
? process.env.KAFKA_BOOTSTRAP_SERVERS.split(',') 
: brokers;
const GROUP_ID = "yuku-consumer-group";

const consumer = new KafkaConsumerService(KAFKA_BROKERS, GROUP_ID);
consumer.start().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  await consumer.disconnect();
  process.exit(0);
});
