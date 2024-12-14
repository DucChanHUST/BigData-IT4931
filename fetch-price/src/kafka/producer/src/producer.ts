import { Kafka, Producer } from 'kafkajs';

class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
  private topic: string;

  constructor(brokers: string[], topic: string) {
    this.kafka = new Kafka({
      clientId: 'yuku-producer',
      brokers: brokers
    });
    this.producer = this.kafka.producer();
    this.topic = topic;
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log('Producer connected successfully');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    console.log('Producer disconnected');
  }

  async sendMessage(message: any): Promise<void> {
    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          { 
            value: JSON.stringify(message),
            timestamp: Date.now().toString()
          }
        ]
      });
      console.log(`Message sent: ${JSON.stringify(message)}`);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async start() {
    await this.connect();
    
    // Send a message every 5 seconds
    setInterval(async () => {
      const message = {
        timestamp: new Date().toISOString(),
        data: 'Hello from TypeScript Kafka Producer!'
      };
      await this.sendMessage(message);
    }, 5000);
  }
}

const KAFKA_BROKERS = ['my-cluster-kafka-bootstrap.ducchan-kafka:9092'];
const TOPIC_NAME = 'token-price';

const producer = new KafkaProducerService(KAFKA_BROKERS, TOPIC_NAME);
producer.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await producer.disconnect();
  process.exit(0);
});