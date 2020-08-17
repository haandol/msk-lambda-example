import os
import json
from kafka import KafkaProducer

BOOTSTRAP_SERVERS = os.environ['BOOTSTRAP_SERVERS'].split(',')
KAFKA_VERSION = os.environ['KAFKA_VERSION'].split('.')


def on_send_success(record_metadata):
    print(record_metadata.topic)
    print(record_metadata.partition)
    print(record_metadata.offset)


def on_send_error(excp):
    log.error('I am an errback', exc_info=excp)


def handler(event, context):
    print(event)
    topic = event['topic']
    data = event['data']

    producer = KafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        api_version=KAFKA_VERSION,
        acks='all',
        security_protocol='SSL',
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    # produce asynchronously with callbacks
    for _ in range(100):
        producer.send(topic, data).add_callback(on_send_success).add_errback(on_send_error)
    # commend if you do not want to flush buffer immediately (in production)
    producer.flush()
    return 'ok'