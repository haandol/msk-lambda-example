import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

interface Props extends cdk.StackProps {
  vpcId: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = scope.node.tryGetContext('ns');

    this.vpc = ec2.Vpc.fromLookup(this, `${ns}Vpc`, { vpcId: props.vpcId });
  }

}