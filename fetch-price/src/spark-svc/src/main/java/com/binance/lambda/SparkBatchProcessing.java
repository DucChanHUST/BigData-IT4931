package com.binance.lambda;

import org.apache.spark.sql.*;
import org.apache.spark.sql.types.*;

import static org.apache.spark.sql.functions.*;

/*
    Xử lý dữ liệu theo chu kỳ (cả ngày, giờ): Token Price Over Time, Market Cap Over Time
    và Transaction Volume Over Time
*/

public class SparkBatchProcessing {
    public static void main(String[] args) {

        // Tạo Spark session
        SparkSession spark = SparkSession.builder()
            .appName("TokenPriceMarketCapBatchProcessing")
            .set("spark.es.nodes", "localhost")  // Địa chỉ Elasticsearch
            .set("spark.es.port", "9200")        // Cổng Elasticsearch
            .set("spark.es.index.auto.create", "true")  // Tự động tạo index nếu chưa có
            .getOrCreate();

        StructType schema = new StructType(new StructField[]{
            new StructField("timestamp", DataTypes.TimestampType, true, null),
            new StructField("token_price", DataTypes.DoubleType, true, null),
            new StructField("market_cap", DataTypes.DoubleType, true, null),
            new StructField("transaction_volume", DataTypes.DoubleType, true, null),
            new StructField("wallet_id", DataTypes.StringType, true, null)
        });

        // Đọc dữ liệu từ HDFS hoặc Json file
        // Đổi đường link lưu file json thu được từ consumer
        Dataset<Row> df = spark.read().schema(schema).json("hdfs://localhost:9000/data/binance");

        // Tính Token Price Over Time (theo giờ)
        Dataset<Row> tokenPriceOverTime = df.groupBy(window(col("timestamp"), "1 hour"))
            .agg(avg("token_price").alias("avg_token_price"))
            .orderBy("window");

        // Tính Market Cap Over Time (theo giờ)
        Dataset<Row> marketCapOverTime = df.groupBy(window(col("timestamp"), "1 hour"))
            .agg(avg("market_cap").alias("avg_market_cap"))
            .orderBy("window");

        // Tính Transaction Volume Over Time (theo giờ)
        Dataset<Row> transactionVolumeOverTime = df.groupBy(window(col("timestamp"), "1 hour"))
            .agg(sum("transaction_volume").alias("total_transaction_volume"))
            .orderBy("window");

        // Lưu kết quả vào HDFS dưới dạng Parquet
        tokenPriceOverTime.write().parquet("hdfs://localhost:9000/data/output/token_price_over_time");
        marketCapOverTime.write().parquet("hdfs://localhost:9000/data/output/market_cap_over_time");
        transactionVolumeOverTime.write().parquet("hdfs://localhost:9000/data/output/transaction_volume_over_time");

        // Lưu kết quả vào Elasticsearch
        tokenPriceOverTime.write()
            .format("org.elasticsearch.spark.sql")
            .option("es.nodes", "localhost:9200")  // Địa chỉ của Elasticsearch cluster
            .option("es.resource", "token_price_over_time/_doc")  // Định danh index trong Elasticsearch
            .option("es.batch.size.entries", "1000")  // Điều chỉnh kích thước batch nếu cần
            .mode(SaveMode.Append)
            .save();

        marketCapOverTime.write()
            .format("org.elasticsearch.spark.sql")
            .option("es.nodes", "localhost:9200")
            .option("es.resource", "market_cap_over_time/_doc")
            .option("es.batch.size.entries", "1000")
            .mode(SaveMode.Append)
            .save();

        transactionVolumeOverTime.write()
            .format("org.elasticsearch.spark.sql")
            .option("es.nodes", "localhost:9200")
            .option("es.resource", "transaction_volume_over_time/_doc")
            .option("es.batch.size.entries", "1000")
            .mode(SaveMode.Append)
            .save();

        spark.stop();
    }
}
