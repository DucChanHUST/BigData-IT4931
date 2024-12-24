FROM apache/spark:3.5.1
USER root

RUN apt-get update && apt-get install -y python3-pip && \
    pip3 install pyspark==3.5.1 kafka-python

# Copy kafka client jars vào thư mục jars của Spark
# COPY --from=bitnami/kafka:latest /opt/bitnami/kafka/libs/kafka-clients-*.jar /opt/spark/jars/
# COPY --from=bitnami/kafka:latest /opt/bitnami/kafka/libs/scala-library-*.jar /opt/spark/jars/

WORKDIR /app
COPY chat.py /app/chat.py
CMD ["spark-submit", \
    "--master", "spark://spark-master.default.svc.cluster.local:7077", \
    "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1,org.apache.spark:spark-streaming-kafka-0-10_2.12:3.5.1", \
    "--conf", "spark.executor.extraJavaOptions=-XX:+HeapDumpOnOutOfMemoryError", \
    "--conf", "spark.driver.extraJavaOptions=-XX:+HeapDumpOnOutOfMemoryError", \
    "--conf", "spark.executor.memory=2g", \
    "--conf", "spark.executor.memoryOverhead=512m", \
    "--conf", "spark.driver.memory=2g", \
    "--conf", "spark.driver.memoryOverhead=512m", \
    "--conf", "spark.streaming.backpressure.enabled=true", \
    "--conf", "spark.streaming.kafka.consumer.poll.ms=512", \
    "--conf", "spark.dynamicAllocation.enabled=false", \
    "chat.py"]
# CMD ["spark-submit", "--master", "spark://10.106.247.191:7077", \
# "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1,org.apache.commons:commons-pool2:2.11.1", \
# "--conf", "spark.driver.extraJavaOptions=-XX:+PrintGCDetails -XX:+PrintGCTimeStamps", \
# "--conf", "spark.executor.extraJavaOptions=-XX:+PrintGCDetails -XX:+PrintGCTimeStamps", \
# "--conf", "spark.executor.extraJavaOptions=-XX:+HeapDumpOnOutOfMemoryError", \
# "--conf", "spark.executor.memory=2g", \
# "--conf", "spark.executor.cores=1", \
# "--conf", "spark.driver.memory=2g", \
# "--conf", "spark.shuffle.service.enabled=true", \
# "--conf", "spark.sql.shuffle.partitions=200", \
# "--conf", "spark.network.timeout=600s", \
# "--conf", "spark.executor.heartbeatInterval=30s", \
# "chat.py"]


# CMD ["spark-submit", "--master", "spark://10.106.247.191:7077", "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1", "spark_consumer.py"]
# CMD ["spark-submit", "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1", "spark_consumer.py"]
# "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1", 