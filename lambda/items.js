const {
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
  DynamoDBDocumentClient,
} = require("@aws-sdk/lib-dynamodb");
const { statusHandler } = require("./utils/statusHandler");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

exports.handler = async function (event, context) {
  const { httpMethod, resource, pathParameters, body } = event;
  const routeKey = `${httpMethod} ${resource}`;
  let statusCode = 200;
  let returnObject = {};
  let dbParams = { TableName: process.env.DB_NAME };
  let itemId, httpStatusCode, price, title, tags, Item;
  const needsId = [
    "GET /items/{itemId}",
    "DELETE /items/{itemId}",
    "PATCH /items/{itemId}",
  ];
  if (needsId.includes(routeKey)) {
    ({ itemId } = pathParameters);
    dbParams.Key = { itemId: itemId };
  }
  const client = new DynamoDBClient({ region: "eu-north-1" });
  const docClient = new DynamoDBDocumentClient(client);

  try {
    switch (routeKey) {
      case "GET /items":
        const { Items } = await docClient.send(new ScanCommand(dbParams));
        returnObject = { items: Items };
        break;
      case "POST /items":
        ({ price, title, tags } = JSON.parse(body));
        const newItem = {
          price,
          title,
          tags,
          itemId: context.awsRequestId,
          created: new Date().toISOString(),
        };
        ({
          $metadata: { httpStatusCode },
        } = await docClient.send(
          new PutCommand({
            ...dbParams,
            Item: newItem,
          })
        ));
        returnObject = statusHandler(httpStatusCode, "successfully created");
        returnObject.item = newItem;
        break;
      case "GET /items/{itemId}":
        ({ Item } = await docClient.send(new GetCommand(dbParams)));
        returnObject = { item: Item };
        break;
      case "DELETE /items/{itemId}":
        ({
          $metadata: { httpStatusCode },
        } = await docClient.send(new DeleteCommand(dbParams)));
        returnObject = statusHandler(httpStatusCode, "successfully deleted");
        break;
      case "PATCH /items/{itemId}":
        ({ price, title, tags } = JSON.parse(body));
        ({
          $metadata: { httpStatusCode },
        } = await docClient.send(
          new UpdateCommand({
            ...dbParams,
            UpdateExpression:
              "SET price = :price, tags = :tags, title = :title",
            ExpressionAttributeValues: {
              ":price": price,
              ":tags": tags,
              ":title": title,
            },
          })
        ));
        returnObject = statusHandler(httpStatusCode, "successfully updated");
        ({ Item } = await docClient.send(new GetCommand(dbParams)));
        returnObject.item = Item;
        break;
      default:
        statusCode = 404;
    }
  } catch (e) {
    statusCode = 400;
    returnObject = { message: e.message };
  }

  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(returnObject),
  };
};
