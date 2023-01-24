import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";

import { Construct } from "constructs";

export class DynamotestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamoDb.Table(this, "Test", {
      partitionKey: { name: "itemId", type: dynamoDb.AttributeType.STRING },
    });

    const tableLambda = new lambda.Function(this, "ItemHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "items.handler",
      environment: { DB_NAME: table.tableName },
    });

    table.grantReadWriteData(tableLambda);

    const itemApi = new apiGateway.LambdaRestApi(this, "ItemAPi", {
      handler: tableLambda,
      proxy: false,
    });
    const eventHandler: apiGateway.LambdaIntegration =
      new apiGateway.LambdaIntegration(tableLambda);

    const items = itemApi.root.addResource("items");
    items.addMethod("GET", eventHandler, { apiKeyRequired: true });
    items.addMethod("POST");

    const item = items.addResource("{itemId}");
    item.addMethod("GET");
    item.addMethod("DELETE");
    item.addMethod("PATCH");

    const plan = itemApi.addUsagePlan("UsagePlan", {
      name: "ItemApiPlan",
      throttle: {
        rateLimit: 500,
        burstLimit: 500,
      },
    });
    const key = itemApi.addApiKey("ApiKey");
    plan.addApiKey(key);
    plan.addApiStage({
      stage: itemApi.deploymentStage,
    });
  }
}
