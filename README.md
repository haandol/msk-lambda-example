# MSK(Managed Streaming for Kafka) + Lambda tutorial

This repository is about example code for MSK(Managed Streaming for Kafka) + Lambda.

Deploying this cdk will provision below architeture on you AWS Account.

![](/imgs/architecture.png)

**Running this repository may cost you to provision AWS resources**

# Prerequisites

- awscli
- Nodejs 10.x+
- Python 3.4+
- AWS Account and Locally configured AWS credential

# Installation

Install project dependencies

```bash
$ npm i
```

Install cdk in global context and run `cdk init` if you did not initailize cdk yet.

```bash
$ npm i -g cdk
$ cdk bootstrap
```

Deploy CDK Stacks on AWS

```bash
$ cdk deploy "*" --require-approval never
```

# Cleanup

destroy provisioned cloud resources

```bash
$ cdk destroy "*"
```