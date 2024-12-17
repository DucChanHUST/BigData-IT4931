from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lag, sum, stddev, desc, window
from pyspark.sql.types import StructType, StructField, TimestampType, DoubleType, StringType
from pyspark.streaming import StreamingContext
from pyspark.streaming.kafka import KafkaUtils
from kafka import KafkaConsumer
import json

# Khởi tạo SparkSession và StreamingContext
spark = SparkSession.builder \
    .appName("TokenPriceMarketCapStreaming") \
    .config("spark.es.nodes", "localhost") \
    .config("spark.es.port", "9200") \
    .config("spark.es.index.auto.create", "true") \
    .getOrCreate()

# Khởi tạo StreamingContext với 60 giây micro-batch
ssc = StreamingContext(spark.sparkContext, 60)

# Định nghĩa schema cho dữ liệu JSON
schema = StructType([
    StructField("timestamp", TimestampType(), True),
    StructField("token_price", DoubleType(), True),
    StructField("market_cap", DoubleType(), True),
    StructField("transaction_volume", DoubleType(), True),
    StructField("wallet_id", StringType(), True)
])

# Đọc dữ liệu streaming từ Kafka
kafkaParams = {
    "bootstrap.servers": "localhost:9092",
    "key.deserializer": "org.apache.kafka.common.serialization.StringDeserializer",
    "value.deserializer": "org.apache.kafka.common.serialization.StringDeserializer",
    "group.id": "spark-streaming-group",
    "auto.offset.reset": "latest"
}

topic = "binance-topic"
kafkaStream = KafkaUtils.createDirectStream(ssc, [topic], kafkaParams)

# Chuyển đổi DStream thành DataFrame
def process_rdd(rdd):
    if not rdd.isEmpty():
        # Chuyển dữ liệu thành DataFrame
        rows = rdd.map(lambda record: record[1].split(","))
        df = spark.createDataFrame(rows, schema)

        # Tính Token Price Change Over Time
        tokenPriceChange = df.withColumn("price_change", 
            col("token_price") - lag("token_price", 1).over(Window.orderBy("timestamp"))) \
            .filter(col("price_change").isNotNull())

        # Whale Wallet Distribution (transaction_volume > 100000)
        whaleWallets = df.filter(col("transaction_volume") > 100000) \
            .groupBy("wallet_id") \
            .agg(sum("transaction_volume").alias("total_volume")) \
            .orderBy(desc("total_volume"))

        # Tính Market Cap Volatility
        marketCapVolatility = df.groupBy(window(col("timestamp"), "1 day")) \
            .agg(stddev("market_cap").alias("market_cap_volatility"))

        # Lưu kết quả vào HDFS dưới dạng Parquet
        tokenPriceChange.write.mode("append").parquet("hdfs://localhost:9000/data/output/token_price_change")
        marketCapVolatility.write.mode("append").parquet("hdfs://localhost:9000/data/output/market_cap_volatility")

        # Lưu kết quả vào Elasticsearch
        tokenPriceChange.write \
            .format("org.elasticsearch.spark.sql") \
            .option("es.nodes", "localhost:9200") \
            .option("es.resource", "token_price_change/_doc") \
            .option("es.batch.size.entries", "1000") \
            .mode("append") \
            .save()

        marketCapVolatility.write \
            .format("org.elasticsearch.spark.sql") \
            .option("es.nodes", "localhost:9200") \
            .option("es.resource", "market_cap_volatility/_doc") \
            .option("es.batch.size.entries", "1000") \
            .mode("append") \
            .save()

# Xử lý dữ liệu streaming
kafkaStream.foreachRDD(process_rdd)

# Bắt đầu stream và đợi kết thúc
ssc.start()
ssc.awaitTermination()
