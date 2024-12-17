import time
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, avg, sum, window
from pyspark.sql.types import StructType, StructField, TimestampType, DoubleType, StringType

def run_batch_processing():
    # Tạo Spark session
    spark = SparkSession.builder \
        .appName("TokenPriceMarketCapBatchProcessing") \
        .config("spark.es.nodes", "localhost")  \
        .config("spark.es.port", "9200") \
        .config("spark.es.index.auto.create", "true") \
        .getOrCreate()

    schema = StructType([
        StructField("timestamp", TimestampType(), True),
        StructField("token_price", DoubleType(), True),
        StructField("market_cap", DoubleType(), True),
        StructField("transaction_volume", DoubleType(), True),
        StructField("wallet_id", StringType(), True)
    ])

    df = spark.read.schema(schema).json("hdfs://localhost:9000/data/binance")

    tokenPriceOverTime = df.groupBy(window(col("timestamp"), "1 hour")) \
        .agg(avg("token_price").alias("avg_token_price")) \
        .orderBy("window")

    marketCapOverTime = df.groupBy(window(col("timestamp"), "1 hour")) \
        .agg(avg("market_cap").alias("avg_market_cap")) \
        .orderBy("window")

    transactionVolumeOverTime = df.groupBy(window(col("timestamp"), "1 hour")) \
        .agg(sum("transaction_volume").alias("total_transaction_volume")) \
        .orderBy("window")

    # Lưu kết quả vào HDFS dưới dạng Parquet
    tokenPriceOverTime.write.parquet("hdfs://localhost:9000/data/output/token_price_over_time")
    marketCapOverTime.write.parquet("hdfs://localhost:9000/data/output/market_cap_over_time")
    transactionVolumeOverTime.write.parquet("hdfs://localhost:9000/data/output/transaction_volume_over_time")

    # Lưu vào Elasticsearch
    tokenPriceOverTime.write \
        .format("org.elasticsearch.spark.sql") \
        .option("es.nodes", "localhost:9200") \
        .option("es.resource", "token_price_over_time/_doc") \
        .option("es.batch.size.entries", "1000") \
        .mode("append") \
        .save()

    marketCapOverTime.write \
        .format("org.elasticsearch.spark.sql") \
        .option("es.nodes", "localhost:9200") \
        .option("es.resource", "market_cap_over_time/_doc") \
        .option("es.batch.size.entries", "1000") \
        .mode("append") \
        .save()

    transactionVolumeOverTime.write \
        .format("org.elasticsearch.spark.sql") \
        .option("es.nodes", "localhost:9200") \
        .option("es.resource", "transaction_volume_over_time/_doc") \
        .option("es.batch.size.entries", "1000") \
        .mode("append") \
        .save()

    spark.stop()

if __name__ == "__main__":
    while True:
        run_batch_processing()
        # Ngừng 1 giờ trước khi chạy lại
        time.sleep(3600)  # Thời gian chờ 1 giờ (3600 giây)
