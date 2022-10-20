import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import * as s3 from "aws-cdk-lib/aws-s3"
import { Construct } from 'constructs';
import {  join as pathJoin,relative} from "path"
import { getPreBucketName, TABLE_NAME, TABLE_PK } from '../constants';
import { GenericTable } from '../infrastructure/generic-table';



// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class POCStack extends cdk.Stack {

  private firstLambda : NodejsFunction


  private api : LambdaRestApi;
  public bucket : s3.Bucket;

  public genericTableWrapper: GenericTable

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this,"pre-upload-bucket-new", {
      publicReadAccess:true,
      versioned:false,
      bucketName: getPreBucketName()
    })

    // create aws bucket
    this.firstLambda = new NodejsFunction(this,"nodejsFn",{
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
      memorySize: 256,
    })

    this.api = new LambdaRestApi(this,"upload-file-api",{handler:this.firstLambda,proxy:false})

    const staticRoutes = this.api.root.addResource('static')
    staticRoutes.addMethod('GET')

    const uploadRoute = this.api.root.addResource('upload')
    uploadRoute.addMethod('POST')

    const tryRoute = this.api.root.addResource('try')
    tryRoute.addMethod('POST')

    const bucketPolicy = new PolicyStatement({
      resources: ['arn:aws:s3:::*'],
      actions:['*']
    })
    
    this.firstLambda.addToRolePolicy(bucketPolicy)
    this.genericTableWrapper = new GenericTable(TABLE_NAME, TABLE_PK, this, [this.firstLambda])

  

    // this.firstLambda.addToRolePolicy()
    // const lambdaNodeFileIntegration = this.firstLambda

    // expose first lambda to public
    // const firstLambdaAsIntegration = new LambdaIntegration(firstLambda)

    // const firstLambdaAsIntegration = new LambdaIntegration(lambdaNodeFileIntegration)
    // const uploadPathResource = this.api.root.addResource("upload")
    // uploadPathResource.addMethod("any",firstLambdaAsIntegration)
  }
}
