package com.binance.lambda;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.net.URI;
import java.util.Collections;
import java.util.Properties;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;

public class BinanceKafkaConsumer {
    private static final int MAX_RECORDS = 10;
    public static void main(String[] args) {
        // Kafka Consumer Config
        Properties props = new Properties();
        props.put("bootstrap.servers", "localhost:9092");
        props.put("group.id", "binance-group");
        props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("auto.offset.reset", "earliest");

        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);

        consumer.subscribe(Collections.singletonList("binance-topic"));

        try {
            // HDFS Config
            Configuration hadoopConfig = new Configuration();
            FileSystem fs = FileSystem.get(new URI("hdfs://localhost:9000"), hadoopConfig);

            while (true) {
                ConsumerRecords<String, String> records = consumer.poll(15000);

                for (ConsumerRecord<String, String> record : records) {
                    // System.out.println("Received data: " + record.value());

                    // Write data to HDFS
                    Path filePath = new Path("/data/binance/" + System.currentTimeMillis() + ".json");
                    System.out.println("Write to " + filePath);
                    BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(fs.create(filePath)));
                    writer.write(record.value());
                    
                    writer.close();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            consumer.close();
        }
    }
}
