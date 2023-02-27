#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { MskStack } from '../lib/stacks/msk-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { ApiGatewayStack } from '../lib/stacks/apigateway-stack';
import { ns } from '../lib/interfaces/constant';

const app = new cdk.App({
  context: {
    ns,
  },
});

const vpcStack = new VpcStack(app, `${ns}VpcStack`);

const mskStack = new MskStack(app, `${ns}MskStack`, {
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
});
mskStack.addDependency(vpcStack);

const lambdaStack = new LambdaStack(app, `${ns}LambdaStack`, {
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  cluster: mskStack.cluster,
});
lambdaStack.addDependency(mskStack);

const apigatewayStack = new ApiGatewayStack(app, `${ns}ApigatewayStack`, {
  producerFunction: lambdaStack.producerFunction,
  createTopicFunction: lambdaStack.createTopicFunction,
});
apigatewayStack.addDependency(lambdaStack);
