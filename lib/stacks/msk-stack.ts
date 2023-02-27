import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as msk from '@aws-cdk/aws-msk-alpha';
import { CfnConfiguration } from 'aws-cdk-lib/aws-msk';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface Props extends cdk.StackProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
}

export class MskStack extends cdk.Stack {
  public readonly cluster: msk.ICluster;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = scope.node.tryGetContext('ns') as string;

    const config = this.newConfiguration();

    this.cluster = new msk.Cluster(this, `MskStack`, {
      clusterName: `${ns.toLowerCase()}`,
      kafkaVersion: msk.KafkaVersion.V2_8_1,
      numberOfBrokerNodes: 2,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [props.securityGroup],
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.M5,
        ec2.InstanceSize.LARGE
      ),
      ebsStorageInfo: { volumeSize: 100 },
      configurationInfo: {
        arn: config.attrArn,
        revision: 1,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.cluster.connections.allowInternally(ec2.Port.allTraffic());
  }

  newConfiguration(): CfnConfiguration {
    const ns = this.node.tryGetContext('ns');

    return new CfnConfiguration(this, `MskConfiguration`, {
      name: `${ns}Configuration`,
      serverProperties: `
auto.create.topics.enable=false
default.replication.factor=2
log.retention.hours=376
log.retention.bytes=-1
unclean.leader.election.enable=false
min.insync.replicas=1
      `,
      kafkaVersionsList: ['2.8.1'],
    });
  }
}
