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

    producer.send(topic, data)
    producer.flush()
    return 'ok'