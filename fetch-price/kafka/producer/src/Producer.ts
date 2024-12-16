import { Kafka, Producer } from "kafkajs";

export class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
  topic: string;

  constructor(brokers: string[], topic: string) {
    this.kafka = new Kafka({
      clientId: `producer-${topic}`,
      brokers: brokers,
    });
    this.producer = this.kafka.producer();
    this.topic = topic;
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log(`Producer for topic "${this.topic}" connected successfully`);
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    console.log(`Producer for topic "${this.topic}" disconnected`);
  }

  async sendMessage(message: any): Promise<void> {
    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });
      console.log(
        `Message sent to topic "${this.topic}": ${JSON.stringify(message)}`
      );
    } catch (error) {
      console.error(`Error sending message to topic "${this.topic}":`, error);
    }
  }
}
