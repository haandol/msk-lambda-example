import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as msk from '@aws-cdk/aws-msk';
import * as lambda from '@aws-cdk/aws-lambda';

interface Props extends cdk.StackProps {
  vpc: ec2.IVpc;
  cluster: msk.CfnCluster;
  subnets: ec2.ISubnet[];
  securityGroup: ec2.ISecurityGroup;
  bootStrapServers: string;
  kafkaVersion: string;
}

export class LambdaStack extends cdk.Stack {
  public readonly createTopicFunction: lambda.IFunction;
  public readonly producerFunction: lambda.IFunction;
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = scope.node.tryGetContext('ns') || '';

    const kafkaLayer = new lambda.LayerVersion(this, `KafkaLayer`, {
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'layers', 'kafka')),
    });
    const role = new iam.Role(this, `FunctionRole`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        { managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaMSKExecutionRole' },
        { managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonMSKFullAccess' },
      ],
    });

    const consumerFunction = new lambda.Function(this, 'ConsumerFunction', {
      functionName: `${ns}Consumerfunction`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnets: props.subnets }),
      securityGroups: [props.securityGroup],
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'functions')),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'consumer.handler',
      role,
      allowPublicSubnet: true,
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    });

    this.producerFunction = new lambda.Function(this, 'ProducerFunction', {
      functionName: `${ns}ProducerFunction`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnets: props.subnets }),
      securityGroups: [props.securityGroup],
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'functions')),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'producer.handler',
      role,
      layers: [kafkaLayer],
      allowPublicSubnet: true,
      environment: {
        BOOTSTRAP_SERVERS: props.bootStrapServers,
        KAFKA_VERSION: props.kafkaVersion,
      },
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    });

    this.createTopicFunction = new lambda.Function(this, 'CreateTopicFunction', {
      functionName: `${ns}CreateTopicFunction`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnets: props.subnets }),
      securityGroups: [props.securityGroup],
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'functions')),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'create_topic.handler',
      role,
      layers: [kafkaLayer],
      allowPublicSubnet: true,
      environment: {
        BOOTSTRAP_SERVERS: props.bootStrapServers,
        KAFKA_VERSION: props.kafkaVersion,
      },
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    });
  }

}
