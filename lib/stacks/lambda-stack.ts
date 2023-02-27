import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as msk from '@aws-cdk/aws-msk-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaPython from '@aws-cdk/aws-lambda-python-alpha';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { ClusterArn, Topic, MskBootstrapServers } from '../interfaces/constant';

interface Props extends cdk.StackProps {
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
}

export class LambdaStack extends cdk.Stack {
  public readonly createTopicFunction: lambda.IFunction;
  public readonly producerFunction: lambda.IFunction;
  public readonly consumerFunction: lambda.IFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = scope.node.tryGetContext('ns') || '';

    this.consumerFunction = new lambdaPython.PythonFunction(
      this,
      'ConsumerFunction',
      {
        functionName: `${ns}Consumerfunction`,
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        securityGroups: [props.securityGroup],
        entry: path.resolve(__dirname, '..', 'functions'),
        runtime: lambda.Runtime.PYTHON_3_9,
        index: 'consumer.py',
        handler: 'handler',
        currentVersionOptions: {
          removalPolicy: cdk.RemovalPolicy.RETAIN,
        },
      }
    );
    this.consumerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['msk:*'],
        resources: ['*'],
      })
    );

    const mskEventSource = new eventSources.ManagedKafkaEventSource({
      topic: Topic,
      clusterArn: ClusterArn,
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    });
    this.consumerFunction.addEventSource(mskEventSource);

    this.producerFunction = new lambdaPython.PythonFunction(
      this,
      'ProducerFunction',
      {
        functionName: `${ns}ProducerFunction`,
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        securityGroups: [props.securityGroup],
        entry: path.resolve(__dirname, '..', 'functions'),
        runtime: lambda.Runtime.PYTHON_3_9,
        index: 'producer.py',
        handler: 'handler',
        environment: {
          BOOTSTRAP_SERVERS: MskBootstrapServers,
          KAFKA_VERSION: msk.KafkaVersion.V2_8_1.version,
        },
        currentVersionOptions: {
          removalPolicy: cdk.RemovalPolicy.RETAIN,
        },
      }
    );
    this.producerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['msk:*'],
        resources: ['*'],
      })
    );

    this.createTopicFunction = new lambdaPython.PythonFunction(
      this,
      'CreateTopicFunction',
      {
        functionName: `${ns}CreateTopicFunction`,
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        securityGroups: [props.securityGroup],
        entry: path.resolve(__dirname, '..', 'functions'),
        runtime: lambda.Runtime.PYTHON_3_9,
        index: 'create_topic.py',
        environment: {
          BOOTSTRAP_SERVERS: MskBootstrapServers,
          KAFKA_VERSION: msk.KafkaVersion.V2_8_1.version,
        },
        currentVersionOptions: {
          removalPolicy: cdk.RemovalPolicy.RETAIN,
        },
      }
    );
    this.createTopicFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['msk:*'],
        resources: ['*'],
      })
    );
  }
}
