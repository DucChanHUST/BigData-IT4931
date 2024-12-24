from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import os

spark = SparkSession.builder \
    .appName("KafkaToHDFS") \
    .config("spark.driver.host", os.getenv("SPARK_DRIVER_HOST")) \
    .config("spark.driver.bindAddress", "0.0.0.0") \
    .config("spark.sql.streaming.checkpointLocation", "/app/checkpoint") \
    .config("spark.streaming.backpressure.enabled", "true") \
    .config("spark.streaming.kafka.consumer.poll.ms", "512") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1") \
    .config("spark.master", "spark://spark-master.default.svc.cluster.local:7077") \
    .config("spark.executor.extraJavaOptions", "-XX:+HeapDumpOnOutOfMemoryError -XX:+PrintGCDetails") \
    .config("spark.driver.extraJavaOptions", "-XX:+HeapDumpOnOutOfMemoryError -XX:+PrintGCDetails") \
    .config("spark.sql.adaptive.enabled", "false") \
    .config("spark.streaming.kafka.maxRatePerPartition", "1000") \
    .config("spark.sql.streaming.kafka.session.timeout.ms", "3000") \
    .config("spark.executor.memory", "2g") \
    .config("spark.executor.memoryOverhead", "512m") \
    .getOrCreate()

kafka_topic = "token"
# kafka_broker = "10.103.226.73:9092,10.104.72.103:9092"
kafka_broker = "kafka-broker1:9092,kafka-broker2:9092"

df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", kafka_broker) \
    .option("subscribe", kafka_topic) \
    .option("startingOffsets", "latest") \
    .option("failOnDataLoss", "false") \
    .option("maxOffsetsPerTrigger", "1000") \
    .option("kafka.group.id", "yuku-consumer-group") \
    .load()


json_schema = StructType([
    StructField("time", StringType(), True)
])

messages = df.selectExpr("CAST(value AS STRING) as message")

parsed = messages.select(from_json(col("message"), json_schema).alias("parsed_message"))
print("---...---...---")
try:
    query = parsed.writeStream \
        .outputMode("append") \
        .format("console") \
        .start()
    print("Stream started successfully")
    query.awaitTermination()
except Exception as e:
    print(f"Detailed error: {str(e)}")
    import traceback
    traceback.print_exc()
    spark.stop()