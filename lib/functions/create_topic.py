import os
import traceback
from kafka import KafkaAdminClient
from kafka.admin import NewTopic

BOOTSTRAP_SERVERS = os.environ['BOOTSTRAP_SERVERS'].split(',')
KAFKA_VERSION = tuple(map(int, os.environ['KAFKA_VERSION'].split('.')))
admin = None


def get_admin():
    global admin
    if admin:
        return admin

    admin = KafkaAdminClient(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        api_version=KAFKA_VERSION,
        security_protocol='SSL'
    )
    return admin
 

def handler(event, context):
    name = event['name']
    try:
        admin = get_admin()
        admin.create_topics([NewTopic(name=name, num_partitions=1, replication_factor=2)])
    except Exception as e:
        admin = None
        traceback.print_exc()
        raise e
    return 'ok'