from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

print("version 3")
print("-------------1")

# Kafka and HDFS configurations
KAFKA_BROKERS = "10.103.226.73:9092,10.104.72.103:9092"
KAFKA_TOPIC = "token,tx"
HDFS_PATH = "hdfs://10.111.11.178:8020/testt"

# Define the schema of the Kafka messages
schema = StructType().add("message", LongType())

# Create Spark Session
spark = SparkSession.builder \
    .appName("KafkaToHDFS") \
    .master("spark://10.106.247.191:7077") \
    .appName("KafkaToHDFS") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1") \
    .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoint") \
    .config("spark.hadoop.fs.defaultFS", "hdfs://10.111.11.178:8020") \
    .getOrCreate()

print("-------------2")
# def process_batch(df, epoch_id):
#     # In dữ liệu của batch hiện tại
#     print(f"Batch {epoch_id}:")
#     df.show(truncate=False)
# Read streaming data from Kafka
raw_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", KAFKA_BROKERS) \
    .option("subscribe", KAFKA_TOPIC) \
    .option("startingOffsets", "latest") \
    .load()

raw_stream.printSchema()
print("-----", raw_stream)
print("---------------------3")
# Parse Kafka value field as JSON
parsed_stream = raw_stream.selectExpr("CAST(value AS STRING)") \
    .select(from_json(col("value"), schema).alias("data")) \
    .select("data.*")

print("---------------------4")

# Write data to HDFS in Parquet format
# query = parsed_stream.writeStream \
#     .outputMode("append") \
#     .format("parquet") \
#     .option("path", HDFS_PATH) \
#     .option("checkpointLocation", "/tmp/spark-checkpoint") \
#     # .foreachBatch(process_batch) \
#     .start()

query = parsed_stream.writeStream \
    .format("parquet") \
    .outputMode("append") \
    .start() \
    .awaitTermination()

print("---------------------5")
query.awaitTermination()
print("---------------------6")
