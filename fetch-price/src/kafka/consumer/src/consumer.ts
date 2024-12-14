import { Kafka, Consumer } from 'kafkajs';

class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private topic: string;
  private groupId: string;

  constructor(brokers: string[], topic: string, groupId: string) {
    this.kafka = new Kafka({
      clientId: 'yuku-consumer',
      brokers: brokers
    });
    this.consumer = this.kafka.consumer({ groupId });
    this.topic = topic;
    this.groupId = groupId;
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    console.log('Consumer connected successfully');
  }

  async subscribe(): Promise<void> {
    await this.consumer.subscribe({ 
      topic: this.topic,
      fromBeginning: true 
    });
  }

  async consume(): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          topic,
          partition,
          offset: message.offset,
          value: message.value?.toString(),
        });
      },
    });
  }

  async start() {
    await this.connect();
    await this.subscribe();
    await this.consume();
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
    console.log('Consumer disconnected');
  }
}

const KAFKA_BROKERS = ['my-cluster-kafka-bootstrap.ducchan-kafka:9092'];
const TOPIC_NAME = 'token-price';
const GROUP_ID = 'yuku-consumer-group';

const consumer = new KafkaConsumerService(KAFKA_BROKERS, TOPIC_NAME, GROUP_ID);
consumer.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await consumer.disconnect();
  process.exit(0);
});