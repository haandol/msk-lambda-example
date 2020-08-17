import * as cdk from '@aws-cdk/core';
import * as msk from '@aws-cdk/aws-msk';
import * as ec2 from '@aws-cdk/aws-ec2';

interface Props extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class MskStack extends cdk.Stack {
  public readonly cluster: msk.CfnCluster;
  public readonly subnets: ec2.ISubnet[];
  public readonly securityGroup: ec2.ISecurityGroup;
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = scope.node.tryGetContext('ns');

    this.securityGroup = new ec2.SecurityGroup(this, `MskSecGrp`, {
      vpc: props.vpc,
    });
    this.securityGroup.connections.allowInternally(ec2.Port.allTraffic());

    this.subnets = props.vpc.publicSubnets.slice(0, 2);

    this.cluster = new msk.CfnCluster(this, `MskStack`, {
      brokerNodeGroupInfo: {
        clientSubnets: this.subnets.map(subnet => subnet.subnetId),
        instanceType: 'kafka.m5.large',
        securityGroups: [this.securityGroup.securityGroupId],
        storageInfo: {
          ebsStorageInfo: { volumeSize:  100 }
        },
      },
      clusterName: `${ns}Cluster`,
      kafkaVersion: '2.4.1',
      numberOfBrokerNodes: 2, 
    });
  }

}
