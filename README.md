# MSK(Managed Streaming for Kafka) + Lambda tutorial

This repository is about example code for MSK(Managed Streaming for Kafka) + Lambda.

Deploying this cdk will provision below architeture on you AWS Account.

![](/imgs/architecture.png)

**Running this repository may cost you to provision AWS resources**

# Prerequisites

- awscli
- Nodejs 16.x+
- Python 3.9+
- Docker
- AWS Account and Locally configured AWS credential

# Installation

Install project dependencies

```bash
$ npm i
```

Install cdk in global context and run `cdk bootstrap` if you did not initailize cdk yet.

```bash
$ npm i -g aws-cdk
$ cdk bootstrap
```

Deploy CDK Stacks on AWS

```bash
$ cd -
$ cdk deploy "*" --require-approval never
```

# Config & Usage

> below example uses [httpie](https://httpie.io/docs)

```bash
$ pip install httpie
```

The repository has two endpoints

- `POST /` - send data to MSK cluster
- `POST /topic` - create topic

After creating MSK cluster,

1. you should change varialbe `MskBootstrapServers` at [**constant.ts**](lib/interfaces/constant.ts) with your actual `bootstrap servers`

<img src="https://haandol.github.io/assets/img/2020/0816/msk-client-info.png" />

2. redeploy lambda function by running `cdk deploy "*"` commands just mentioned above.

you can see the MSK trigger has been `Enabled` on you `Consumer` Function on Lambda page.

<img src="https://haandol.github.io/assets/img/2020/0816/msk-trigger.png" />

3. invoke api-gateway `/topic` to create topic, the endpoint aws printed on your terminal after deploying cdk.

```bash
$ http post https://xxx.execute-api.us-east-1.amazonaws.com/dev/topic name=mytopic
HTTP/1.1 200 OK
Access-Control-Allow-Credentials: false
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent
Access-Control-Allow-Methods: OPTIONS,POST,GET
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 4
Content-Type: application/json
Date: Mon, 17 Aug 2020 15:39:10 GMT
X-Amzn-Trace-Id: Root=1-5f3aa49c-2fa1d3e57e4977bf96267892;Sampled=0
x-amz-apigw-id: Ra6oeH89oAMF_gg=
x-amzn-RequestId: 85433fef-d309-4d78-850c-df78f89a0b64

"ok"
```

4. lastly, you can send data to topic

```bash
$ http post https://xxx.execute-api.us-east-1.amazonaws.com/dev topic=mytopic data="Hello MSK"
HTTP/1.1 200 OK
Access-Control-Allow-Credentials: false
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent
Access-Control-Allow-Methods: OPTIONS,POST,GET
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 4
Content-Type: application/json
Date: Mon, 17 Aug 2020 15:40:14 GMT
X-Amzn-Trace-Id: Root=1-5f3aa4dd-00933f9a2471b5680fe69ff6;Sampled=0
x-amz-apigw-id: Ra6ykEo6IAMF6uQ=
x-amzn-RequestId: ac315665-2b02-422c-bc87-0840c89954dc

"ok"
```

5. or see logs of consumer function on CloudWatch to confirm the function is polling data from MSK

![](/imgs/consumer-log.png)

```bash
$ echo "IkhlbGxvIE1TSyI=" | base64 -d
"Hello MSK"%
```

# Troubleshoot

## PROBLEM: Connection error, Please check your event source connection configuration.

you created eventsource without `NAT Gateway`.

`NAT Gateway` is required to MSK communicate with Lambda function. And make sure your MSK cluster is provisioned on the `private subnet` to use the NAT Gateway.

# Cleanup

destroy provisioned cloud resources

```bash
$ cdk destroy "*"
```
