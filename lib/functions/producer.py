import json
from kafka import KafkaProducer


def handler(event, context):
    topic = event['topic']
    data = event['data']

    producer = KafkaProducer(
        bootstrap_servers=[
            'b-2.mskexamplealphacl.ps2g8g.c3.kafka.ap-northeast-2.amazonaws.com:9094',
            'b-1.mskexamplealphacl.ps2g8g.c3.kafka.ap-northeast-2.amazonaws.com:9094',
        ],
        api_version=(2, 2, 1),
        acks=1,
        security_protocol='SSL',
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )

    for _ in range(100):
        future = producer.send(topic, data)
        record_metadata = future.get(timeout=1)
        print (record_metadata.topic)
        print (record_metadata.partition)
        print (record_metadata.offset)
    producer.flush()
    return 'ok'