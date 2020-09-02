#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { VpcStack } from '../lib/vpc-stack';
import { MskStack } from '../lib/msk-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiGatewayStack } from '../lib/apigateway-stack';
import { VpcId, MskBootstrapServers, KafkaVersion } from '../lib/interfaces/constant';

const ns = 'MskExampleAlpha';
const StackProps = {
  env: {
    account: '929831892372',
    region: 'ap-northeast-2',
  }
};

const app = new cdk.App({
  context: {
    ns,
  },
});

const vpcStack = new VpcStack(app, `${ns}VpcStack`, {
  ...StackProps,
  vpcId: VpcId,
});

const mskStack = new MskStack(app, `${ns}MskStack`, {
  ...StackProps,
  vpc: vpcStack.vpc,
});
mskStack.addDependency(vpcStack);

const lambdaStack = new LambdaStack(app, `${ns}LambdaStack`, {
  ...StackProps,
  vpc: vpcStack.vpc,
  cluster: mskStack.cluster,
  subnets: mskStack.subnets,
  securityGroup: mskStack.securityGroup,
  bootStrapServers: MskBootstrapServers,
  kafkaVersion: KafkaVersion,
});
lambdaStack.addDependency(mskStack);

const apigatewayStack = new ApiGatewayStack(app, `${ns}ApigatewayStack`, {
  producerFunction: lambdaStack.producerFunction,
  createTopicFunction: lambdaStack.createTopicFunction,
});
apigatewayStack.addDependency(lambdaStack);