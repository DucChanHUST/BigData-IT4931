from pyspark.sql import SparkSession
from pyspark.sql.functions import col

print(0)
# Cấu hình Spark
spark = (
    SparkSession.builder.appName("Kafka to HDFS")
    .config("spark.sql.warehouse.dir", "/user/spark/warehouse")
    .config("spark.hadoop.fs.defaultFS", "hdfs://hdfs-namenode:8020")
    .getOrCreate()
)

print(1)
# Đọc dữ liệu từ Kafka
kafka_df = (
    spark.readStream.format("kafka")
    .option("kafka.bootstrap.servers", "my-cluster-kafka-bootstrap.ducchan-kafka:9092")
    .option("subscribe", "token")
    .load()
)

print(2)
# Chuyển đổi dữ liệu Kafka (chuyển từ dạng byte sang string)
message_df = kafka_df.selectExpr("CAST(value AS STRING)")

print(3)
# Ghi vào HDFS
query = (
    message_df.writeStream.outputMode("append")
    .format("text")
    .option("checkpointLocation", "/user/spark/checkpoints/kafka-to-hdfs")
    .option("path", "/user/spark/kafka_data")
    .start()
)

print(4)
query.awaitTermination()
