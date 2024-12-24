from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import time

# Kafka configuration
kafka_topic = "token"
kafka_broker = "kafka-broker1:9092,kafka-broker2:9092"

# Initialize Spark with detailed logging
spark = SparkSession.builder \
    .appName("KafkaToHDFS") \
    .config("spark.sql.streaming.checkpointLocation", "/app/checkpoint") \
    .config("spark.streaming.backpressure.enabled", "true") \
    .config("spark.executor.extraJavaOptions", "-Dlog4j.logger.org.apache.spark.sql.kafka=DEBUG") \
    .getOrCreate()

# Set log level
spark.sparkContext.setLogLevel("DEBUG")

print("Starting Kafka stream reading...")

def test_kafka_connection():
    try:
        # Test connection using a non-streaming read
        df_test = spark.read \
            .format("kafka") \
            .option("kafka.bootstrap.servers", kafka_broker) \
            .option("subscribe", kafka_topic) \
            .option("startingOffsets", "earliest") \
            .option("endingOffsets", "latest") \
            .load()
        
        count = df_test.count()
        print(f"Successfully connected to Kafka. Found {count} messages in topic.")
        return True
    except Exception as e:
        print(f"Failed to connect to Kafka: {str(e)}")
        return False

# Test connection first
print("Testing Kafka connection...")
if not test_kafka_connection():
    print("Failed to connect to Kafka. Exiting...")
    spark.stop()
    exit(1)

try:
    # Read from Kafka with debug options
    df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", kafka_broker) \
        .option("subscribe", kafka_topic) \
        .option("startingOffsets", "latest") \
        .option("failOnDataLoss", "false") \
        .load()
    
    print("Successfully created Kafka stream DataFrame")
    print("DataFrame schema:")
    df.printSchema()
    
    json_schema = StructType([
        StructField("time", StringType(), True)
    ])
    
    # Parse and process messages
    parsed = df \
        .selectExpr("CAST(value AS STRING) as message") \
        .select(from_json(col("message"), json_schema).alias("parsed_message")) \
        .select("parsed_message.*")
    
    # Write to console
    print("Starting stream query...")
    query = parsed \
        .writeStream \
        .outputMode("append") \
        .format("console") \
        .option("truncate", "false") \
        .trigger(processingTime="5 seconds") \
        .start()
    
    print("Stream started successfully, waiting for data...")
    query.awaitTermination()

except Exception as e:
    print(f"Error in streaming: {str(e)}")
    import traceback
    traceback.print_exc()
    spark.stop()