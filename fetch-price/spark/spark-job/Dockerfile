# Sử dụng image chính thức của PySpark
FROM bitnami/spark:3.3.2

# Cài đặt các thư viện cần thiết
RUN pip install pyspark kafka-python

# Copy file Python vào trong container
COPY spark_consumer.py /usr/local/spark/app/

# Thiết lập thư mục làm việc
WORKDIR /usr/local/spark/app/

# Mở cổng cần thiết (nếu cần)
EXPOSE 7077

# Chạy ứng dụng khi container khởi động
CMD ["spark-submit", "--master", "spark://spark-master:7077", "spark_consumer.py"]
