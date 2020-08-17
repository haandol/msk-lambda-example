import logging
from kafka import KafkaAdminClient
from kafka.admin import NewTopic

admin = None


def get_admin():
    global admin
    if admin:
        return admin

    admin = KafkaAdminClient(
        bootstrap_servers=[
        'b-2.mskexamplealphacl.ps2g8g.c3.kafka.ap-northeast-2.amazonaws.com:9094',
        'b-1.mskexamplealphacl.ps2g8g.c3.kafka.ap-northeast-2.amazonaws.com:9094',
        ],
        api_version=(2, 2, 1),
        security_protocol='SSL'
    )
    return admin
 

def handler(event, context):
    name = event['name']
    try:
        admin = get_admin()
        admin.create_topics([NewTopic(name=name, num_partitions=1, replication_factor=2)])
    except:
        admin = None
        traceback.print_exc()
    return 'ok'