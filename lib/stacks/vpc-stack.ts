import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly securityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, `Vpc`, { maxAzs: 2 });

    this.securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'DefaultSecurityGroup',
      vpc.vpcDefaultSecurityGroup
    );
    this.vpc = vpc;
  }
}
