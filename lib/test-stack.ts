import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaIntegration, RestApi, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import { PolicyStatement, Policy } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import * as s3 from "aws-cdk-lib/aws-s3"
import { Construct } from 'constructs';
import {  join as pathJoin,relative} from "path"



// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TestStack extends cdk.Stack {

  private firstLambda = new NodejsFunction(this,"nodejsFn",{
    entry: pathJoin(__dirname , "..", "lambda", "upload.ts"),
    handler:'handler',
    bundling: {
      commandHooks:{
        beforeBundling(inputDir:string,outputDir:string){
          const staticAssets = pathJoin(__dirname, "..", "public")
          const relativePath = relative(inputDir,staticAssets)
          return [`cp -r ${relativePath} ${outputDir}`]
        },
        afterBundling(inputDir:string,outputDir:string){
          return []
        },
        beforeInstall(){
          return []
        }
      }
    },
  })


  private api = new LambdaRestApi(this,"upload-file-api",{handler:this.firstLambda,proxy:false})
  public bucket : s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const staticRoutes = this.api.root.addResource('static')
    staticRoutes.addMethod('GET')

    const uploadRoute = this.api.root.addResource('upload')
    uploadRoute.addMethod('POST')

    const tryRoute = this.api.root.addResource('try')
    tryRoute.addMethod('POST')

    

     // create aws bucket
     this.bucket = new s3.Bucket(this,"pre-upload-bucket",{
      publicReadAccess:true,
      versioned:true,
    })

    const bucketPolicy = new PolicyStatement({
      resources: ['arn:aws:s3:::*'],
      actions:['s3:ListAllMyBuckets','s3:*Object']
    })

    this.firstLambda.addToRolePolicy(bucketPolicy)

    // this.firstLambda.addToRolePolicy()
    // const lambdaNodeFileIntegration = this.firstLambda

   

    // expose first lambda to public
    // const firstLambdaAsIntegration = new LambdaIntegration(firstLambda)

    // const firstLambdaAsIntegration = new LambdaIntegration(lambdaNodeFileIntegration)
    // const uploadPathResource = this.api.root.addResource("upload")
    // uploadPathResource.addMethod("any",firstLambdaAsIntegration)
    
    
    // The code that defines your stack goes here
    // example resource
    // const queue = new sqs.Queue(this, 'TestQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
