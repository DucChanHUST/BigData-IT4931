package com.binance.lambda;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.spark.SparkConf;
import org.apache.spark.sql.*;
import org.apache.spark.sql.functions.*;
import org.apache.spark.sql.types.*;
import org.apache.spark.streaming.*;
import org.apache.spark.streaming.api.java.*;
import org.apache.spark.streaming.kafka010.*;
import org.elasticsearch.spark.*;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import scala.Tuple2;

import java.util.*;
import java.util.stream.Collectors;

public class SparkKafkaStreaming {
    public static void main(String[] args) throws InterruptedException {
        // Khởi tạo SparkSession và StreamingContext
        SparkSession spark = SparkSession.builder()
            .appName("TokenPriceMarketCapStreaming")
            .set("spark.es.nodes", "localhost")  // Địa chỉ Elasticsearch
            .set("spark.es.port", "9200")        // Cổng Elasticsearch
            .set("spark.es.index.auto.create", "true")
            .getOrCreate();
        
        JavaStreamingContext jssc = new JavaStreamingContext(spark.sparkContext(), Durations.seconds(60));

        // Định nghĩa schema cho dữ liệu JSON
        StructType schema = new StructType(new StructField[] {
            new StructField("timestamp", DataTypes.TimestampType, true, null),
            new StructField("token_price", DataTypes.DoubleType, true, null),
            new StructField("market_cap", DataTypes.DoubleType, true, null),
            new StructField("transaction_volume", DataTypes.DoubleType, true, null),
            new StructField("wallet_id", DataTypes.StringType, true, null)
        });

        // Đọc dữ liệu streaming từ Kafka
        Map<String, Object> kafkaParams = new HashMap<>();
        kafkaParams.put("bootstrap.servers", "localhost:9092");
        kafkaParams.put("key.deserializer", StringDeserializer.class);
        kafkaParams.put("value.deserializer", StringDeserializer.class);
        kafkaParams.put("group.id", "spark-streaming-group");
        kafkaParams.put("auto.offset.reset", "latest");

        // Đọc từ topic Kafka
        String topic = "binance-topic";
        JavaInputDStream<ConsumerRecord<String, String>> stream = KafkaUtils.createDirectStream(
                jssc, LocationStrategies.PreferConsistent(), ConsumerStrategies.Subscribe(Arrays.asList(topic), kafkaParams));

        // Chuyển đổi DStream thành DataFrame
        JavaDStream<Row> rows = stream.map((Function<ConsumerRecord<String, String>, Row>) record -> {
            String line = record.value();
            String[] fields = line.split(",");
            return RowFactory.create(fields[0], Double.parseDouble(fields[1]), Double.parseDouble(fields[2]), 
                    Double.parseDouble(fields[3]), fields[4]);
        });

        // Tạo DataFrame từ DStream
        Dataset<Row> df = spark.createDataFrame(rows, schema);

        // Tính Token Price Change Over Time
        Dataset<Row> tokenPriceChange = df.withColumn("price_change", 
            col("token_price").minus(lag("token_price", 1).over(Window.orderBy("timestamp"))))
            .filter(col("price_change").isNotNull());

        // Whale Wallet Distribution (transaction_volume > 100000)
        Dataset<Row> whaleWallets = df.filter(col("transaction_volume").gt(100000))
            .groupBy("wallet_id")
            .agg(sum("transaction_volume").alias("total_volume"))
            .orderBy(desc("total_volume"));

        // Tính Market Cap Volatility
        Dataset<Row> marketCapVolatility = df.groupBy(window(col("timestamp"), "1 day"))
            .agg(stddev("market_cap").alias("market_cap_volatility"));

        // Lưu kết quả vào HDFS hoặc Kafka
        tokenPriceChange.writeStream().outputMode("append").format("parquet")
            .option("path", "hdfs://localhost:9000/data/output/token_price_change").start();

        tokenPriceChange.writeStream()
            .outputMode("append")
            .format("org.elasticsearch.spark.sql")
            .option("es.nodes", "localhost:9200")  // Địa chỉ của Elasticsearch cluster
            .option("es.resource", "token_price_change/_doc")  // Định danh index trong Elasticsearch
            .option("es.batch.size.entries", "1000")  // Điều chỉnh kích thước batch nếu cần
            .start();

        whaleWallets.writeStream().outputMode("complete").format("console").start();

        marketCapVolatility.writeStream().outputMode("complete").format("parquet")
            .option("path", "hdfs://localhost:9000/data/output/market_cap_volatility").start();

        marketCapVolatility.writeStream()
            .outputMode("complete")
            .format("org.elasticsearch.spark.sql")
            .option("es.nodes", "localhost:9200")  // Địa chỉ của Elasticsearch cluster
            .option("es.resource", "market_cap-volatility/_doc")  // Định danh index trong Elasticsearch
            .option("es.batch.size.entries", "1000")  // Điều chỉnh kích thước batch nếu cần
            .start();

        // Bắt đầu stream và đợi kết thúc
        jssc.start();
        jssc.awaitTermination();
    }
}
