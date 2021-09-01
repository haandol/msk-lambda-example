import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as msk from '@aws-cdk/aws-msk';
import * as lambda from '@aws-cdk/aws-lambda';
import * as eventSources from '@aws-cdk/aws-lambda-event-sources'
import { ClusterArn, Topic, MskBootstrapServers } from '../interfaces/constant'

interface Props extends cdk.StackProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
}

export class LambdaStack extends cdk.Stack {
  public readonly createTopicFunction: lambda.IFunction;
  public readonly producerFunction: lambda.IFunction;
  public readonly consumerFunction: lambda.IFunction;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = scope.node.tryGetContext('ns') || '';

    const kafkaLayer = new lambda.LayerVersion(this, `KafkaLayer`, {
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
      code: lambda.Code.fromAsset(path.resolve(__dirname, '..', 'layers', 'kafka')),
    });

    this.consumerFunction = new lambda.Function(this, 'ConsumerFunction', {
      functionName: `${ns}Consumerfunction`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE }),
      securityGroups: [props.securityGroup],
      code: lambda.Code.fromAsset(path.resolve(__dirname, '..', 'functions')),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'consumer.handler',
      allowPublicSubnet: true,
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    });
    this.consumerFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['msk:*'],
      resources: ['*'],
    }))

    const mskEventSource = new eventSources.ManagedKafkaEventSource({
      topic: Topic,
      clusterArn: ClusterArn,
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    })
    this.consumerFunction.addEventSource(mskEventSource)

    this.producerFunction = new lambda.Function(this, 'ProducerFunction', {
      functionName: `${ns}ProducerFunction`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE }),
      securityGroups: [props.securityGroup],
      code: lambda.Code.fromAsset(path.resolve(__dirname, '..', 'functions')),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'producer.handler',
      layers: [kafkaLayer],
      allowPublicSubnet: true,
      environment: {
        BOOTSTRAP_SERVERS: MskBootstrapServers,
        KAFKA_VERSION: msk.KafkaVersion.V2_2_1.version,
      },
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    });
    this.producerFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['msk:*'],
      resources: ['*'],
    }))

    this.createTopicFunction = new lambda.Function(this, 'CreateTopicFunction', {
      functionName: `${ns}CreateTopicFunction`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE }),
      securityGroups: [props.securityGroup],
      code: lambda.Code.fromAsset(path.resolve(__dirname, '..', 'functions')),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'create_topic.handler',
      layers: [kafkaLayer],
      allowPublicSubnet: true,
      environment: {
        BOOTSTRAP_SERVERS: MskBootstrapServers,
        KAFKA_VERSION: msk.KafkaVersion.V2_2_1.version,
      },
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    });
    this.createTopicFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['msk:*'],
      resources: ['*'],
    }))

  }

}
