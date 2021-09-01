import * as cdk from '@aws-cdk/core';
import * as msk from '@aws-cdk/aws-msk';
import * as ec2 from '@aws-cdk/aws-ec2';

interface Props extends cdk.StackProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup
}

export class MskStack extends cdk.Stack {
  public readonly cluster: msk.ICluster;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = scope.node.tryGetContext('ns');

    this.cluster = new msk.Cluster(this, `MskStack`, {
      clusterName: `${ns}Cluster`,
      kafkaVersion: msk.KafkaVersion.V2_2_1,
      numberOfBrokerNodes: 2, 
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      securityGroups: [props.securityGroup],
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
      ebsStorageInfo: { volumeSize: 100 },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.cluster.connections.allowInternally(ec2.Port.allTraffic())
  }

}
