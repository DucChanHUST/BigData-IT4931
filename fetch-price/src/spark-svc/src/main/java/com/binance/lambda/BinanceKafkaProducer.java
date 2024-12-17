package com.binance.lambda;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.Callback;


import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Properties;

public class BinanceKafkaProducer {
    public static void main(String[] args) {
        // Kafka Producer Config
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
                "org.apache.kafka.common.serialization.StringSerializer");
        KafkaProducer<String, String> producer = new KafkaProducer<>(props);

        // Binance API URL
        String binanceApiUrl = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m";

        try {
            while (true) {
                // Fetch data from Binance API
                HttpURLConnection connection = (HttpURLConnection) new URL(binanceApiUrl).openConnection();
                connection.setRequestMethod("GET");
                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                String inputLine;
                StringBuilder response = new StringBuilder();

                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();

                // Send data to Kafka
                producer.send(new ProducerRecord<>("binance-topic", response.toString()), new Callback() {
                    @Override
                    public void onCompletion(RecordMetadata metadata, Exception exception) {
                        if (exception != null) {
                            System.out.println("Error sending message: " + exception.getMessage());
                        } else {
                            System.out.println("Message sent successfully to " + metadata.topic());
                        }
                    }
                });

                // Sleep for a short interval before the next request
                Thread.sleep(15000);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            producer.close();
        }
    }
}
