import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as subscription from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import { join as pathJoin, relative } from "path";
import { getPreBucketName, TABLE_NAME, TABLE_PK } from "../constants";
import { GenericTable } from "../infrastructure/generic-table";
import { SnsDestination } from "aws-cdk-lib/aws-s3-notifications";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { ServerlessClamscan } from "cdk-serverless-clamscan";
import { LambdaDestination } from "aws-cdk-lib/aws-lambda-destinations";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class POCStack extends cdk.Stack {
  private firstLambda: NodejsFunction;

  private preBucketUploadTopic: sns.Topic;
  private sqs: sqs.Queue;

  private consoleLambda: NodejsFunction = new NodejsFunction(
    this,
    "console-lambda",
    {
      entry: pathJoin(__dirname, "..", "lambda", "notification-test.ts"),
      handler: "handler",
    }
  );

  private api: LambdaRestApi;
  public bucket: s3.Bucket;

  public genericTableWrapper: GenericTable;
  public clamAV: ServerlessClamscan;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "pre-upload-bucket-new", {
      publicReadAccess: true,
      versioned: false,
      bucketName: getPreBucketName(),
    });

    this.sqs = new sqs.Queue(this, "firstSQS", {
      // fifo:true
    });

    this.clamAV = new ServerlessClamscan(this, "clamScan", {
      buckets: [this.bucket],
      onResult: new LambdaDestination(this.consoleLambda),
      onError: new LambdaDestination(this.consoleLambda),
      scanFunctionMemorySize: 3008,
    });

    // create aws bucket
    this.firstLambda = new NodejsFunction(this, "nodejsFn", {
      entry: pathJoin(__dirname, "..", "lambda", "upload.ts"),
      handler: "handler",
      bundling: {
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string) {
            console.log(process.platform, ">>x>x>X>X>X>X>X>X>X>X>X>XX>");
            const staticAssets = pathJoin(__dirname, "..", "public");
            const relativePath = relative(inputDir, staticAssets);
            const windowsPowershellCommand = [
              `xcopy /F ${relativePath} ${outputDir} `,
            ];
            const bashCommand = [`cp -r ${relativePath} ${outputDir}`];
            if (process.platform === "win32") {
              try {
                return windowsPowershellCommand;
              } catch (er) {
                return bashCommand;
              }
            }
            return bashCommand;
          },
          afterBundling(inputDir: string, outputDir: string) {
            return [];
          },
          beforeInstall() {
            return [];
          },
        },
      },
      memorySize: 256,
    });

    this.api = new LambdaRestApi(this, "upload-file-api", {
      handler: this.firstLambda,
      proxy: false,
    });

    const staticRoutes = this.api.root.addResource("static");
    staticRoutes.addMethod("GET");

    const uploadRoute = this.api.root.addResource("upload");
    uploadRoute.addMethod("POST");

    const tryRoute = this.api.root.addResource("try");
    tryRoute.addMethod("POST");

    const bucketPolicy = new PolicyStatement({
      resources: ["arn:aws:s3:::*"],
      actions: ["*"],
    });

    this.firstLambda.addToRolePolicy(bucketPolicy);
    this.genericTableWrapper = new GenericTable(TABLE_NAME, TABLE_PK, this, [
      this.firstLambda,
    ]);

    // create sns t]opic
    this.preBucketUploadTopic = new sns.Topic(this, "new-file-in-pre-bucket", {
      displayName: "New file in staging bucket",
      topicName: "stageBucketFileUpload",
      // fifo:true
    });

    // this.bucket.addEventNotification(
    //   s3.EventType.OBJECT_CREATED,
    //   new SnsDestination(this.preBucketUploadTopic)
    // );

    // this.preBucketUploadTopic.addSubscription(
    //   new subscription.SqsSubscription(this.sqs)
    // );

    // this.preBucketUploadTopic.addSubscription(
    //   new subscription.LambdaSubscription(this.consoleLambda)
    // );

    // this.consoleLambda.addEventSource(new SqsEventSource(this.sqs));
  }
}
