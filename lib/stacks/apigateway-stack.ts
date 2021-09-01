import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';

interface Props extends cdk.StackProps {
  producerFunction: lambda.IFunction;
  createTopicFunction: lambda.IFunction;
}

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = scope.node.tryGetContext('ns') || '';

    const stageName = 'dev'
    const api = new apigw.RestApi(this, `RestApi`, {
      restApiName: `${ns}RestApi`,
      deploy: true,
      deployOptions: {
        stageName,
        loggingLevel: apigw.MethodLoggingLevel.ERROR,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
      },
      endpointConfiguration: {
        types: [apigw.EndpointType.REGIONAL],
      },
    });

    const methodOptions: apigw.MethodOptions = {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigw.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        }
      ],
    };
    const credentialsRole = new iam.Role(this, 'ApigwCredentialRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        { managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs' },
        { managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' },
        { managedPolicyArn: 'arn:aws:iam::aws:policy/AWSLambda_FullAccess' },
      ],
    });
    const requestTemplates = {
      'application/json': "$input.json('$')",
    };
    const integrationResponses: apigw.IntegrationResponse[] = [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST,GET'",
          'method.response.header.Access-Control-Allow-Credentials': "'false'",
        },
      }
    ];

    const producerIntegration = new apigw.LambdaIntegration(props.producerFunction, {
      proxy: false,
      passthroughBehavior: apigw.PassthroughBehavior.NEVER,
      credentialsRole,
      requestTemplates,
      integrationResponses,
    });
    api.root.addMethod('POST', producerIntegration, methodOptions);

    const topicIntegration = new apigw.LambdaIntegration(props.createTopicFunction, {
      proxy: false,
      passthroughBehavior: apigw.PassthroughBehavior.NEVER,
      credentialsRole,
      requestTemplates,
      integrationResponses,
    });
    api.root.addResource('topic').addMethod('POST', topicIntegration, methodOptions);
  }

}