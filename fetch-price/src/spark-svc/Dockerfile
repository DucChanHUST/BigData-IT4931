FROM openjdk:8-jdk-alpine

RUN apk update && apk add --no-cache bash curl maven

ENV SPARK_VERSION 3.5.3
ENV HADOOP_VERSION 3
RUN curl -o /tmp/spark.tar.gz -L https://archive.apache.org/dist/spark/spark-$SPARK_VERSION/spark-$SPARK_VERSION-bin-hadoop$HADOOP_VERSION.tgz && \
    tar -xvf /tmp/spark.tar.gz -C /opt && \
    rm /tmp/spark.tar.gz

ENV SPARK_HOME /opt/spark-$SPARK_VERSION-bin-hadoop$HADOOP_VERSION
ENV PATH $PATH:$SPARK_HOME/bin

WORKDIR /app
COPY . /app

# Run maven
RUN mvn clean install