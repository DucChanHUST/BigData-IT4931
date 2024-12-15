package spark;

import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.*;
import org.apache.spark.streaming.*;
import org.apache.spark.streaming.api.java.JavaStreamingContext;
import org.apache.spark.streaming.kafka010.*;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.spark.streaming.dstream.InputDStream;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.spark.streaming.dstream.DStream;
import org.apache.spark.sql.types.*;

import java.util.*;

public class SparkStreamingKafkaCoinGecko {
    public static void main(String[] args) throws InterruptedException {
        SparkSession spark = SparkSession.builder()
                .appName("Transaction Volume Processing")
                .getOrCreate();

        JavaSparkContext sc = new JavaSparkContext(spark.sparkContext());
        JavaStreamingContext ssc = new JavaStreamingContext(sc, Durations.seconds(30));

        String kafkaBrokers = "my-cluster-kafka-bootstrap.ducchan-kafka:9092";
        String topic = "token-price";

        Map<String, Object> kafkaParams = new HashMap<>();
        kafkaParams.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaBrokers);
        kafkaParams.put(ConsumerConfig.GROUP_ID_CONFIG, "yuku-consumer-group");
        kafkaParams.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        kafkaParams.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        Collection<String> topics = Arrays.asList(topic);
        InputDStream<ConsumerRecord<String, String>> messages = KafkaUtils.createDirectStream(
            ssc,
            LocationStrategies.PreferConsistent(),
            ConsumerStrategies.Subscribe(topics, kafkaParams)
        );

        DStream<String> tokenPriceStream = messages.map(record -> record.value());

        StructType schema = new StructType()
            .add("id", "string")
            .add("symbol", "string")
            .add("name", "string")
            .add("current_price", "double")
            .add("market_cap", "long")
            .add("total_volumes", "long")
            .add("timestamp", "string");

        DStream<Row> transactionData = tokenPriceStream.map(record -> {
            Dataset<Row> jsonData = spark.read().json(spark.createDataset(Collections.singletonList(record), Encoders.STRING()));
            return jsonData.select("id", "symbol", "name", "current_price", "market_cap", "total_volumes", "timestamp").collectAsList();
        });

        Dataset<Row> tokenPriceData = spark.createDataFrame(transactionData, schema);

        String today = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        Dataset<Row> todaysData = tokenPriceData.filter(
            functions.col("timestamp").startsWith(today)
        );

        // Lưu tổng volume vào file CSV
        Dataset<Row> totalVolume = todaysData.groupBy().sum("total_volumes");
        totalVolume.write()
            .format("csv")
            .option("header", "true")
            .mode("append")
            .save("/tmp/total_volume.csv");

        /*
        // Lưu vào Elastic Search
        Dataset<Row> totalVolume = todaysData.groupBy().sum("total_volumes");
        totalVolume.write()
            .format("org.elasticsearch.spark.sql")
            .option("es.resource", "total-volume/_doc")
            .option("es.nodes", "elasticsearch-service")
            .option("es.port", "9200")
            .mode("append")
            .save();
         */

        double whaleVolumeThreshold = 1000000.0; // $1000000
        Dataset<Row> whaleTransactions = todaysData.filter(
            functions.col("total_volumes").gt(whaleVolumeThreshold)
        );

        // Lưu tổng giá trị whale
        Dataset<Row> whaleVolume = whaleTransactions.groupBy("symbol").sum("total_volumes");
        whaleVolume.write()
            .format("csv")
            .option("header", "true")
            .mode("append")
            .save("/tmp/whale_volume.csv");

        /*
        Dataset<Row> whaleVolume = whaleTransactions.groupBy("symbol").sum("total_volumes");
        whaleVolume.write()
            .format("org.elasticsearch.sp   ark.sql")
            .option("es.resource", "whale-volume/_doc")
            .option("es.nodes", "elasticsearch-service")
            .option("es.port", "9200")
            .mode("append")
            .save();
         */

        ssc.start();
        ssc.awaitTermination();
    }
}
