import * as cdk from 'aws-cdk-lib';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import {join as pathJoin} from "path"

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new LambdaFunction(this,"testLambda", {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(pathJoin(__dirname , "..", "lambda")),
      handler : 'hello.main'
    })

    
    // The code that defines your stack goes here
    // example resource
    // const queue = new sqs.Queue(this, 'TestQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
