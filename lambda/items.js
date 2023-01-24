const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

exports.handler = async function (event) {
  const { httpMethod, resource, pathParameters } = event;
  const routeKey = `${httpMethod} ${resource}`;
  let itemId = null;
  let statusCode = 200;
  let returnObject = {};
  let dbParams = { TableName: process.env.DB_NAME };
  const needsId = [
    "GET /items/{itemId}",
    "DELETE /items/{itemId}",
    "PATCH /items/{itemId}",
  ];

  if (needsId.includes(routeKey)) {
    ({ itemId } = pathParameters);
  }
  const client = new DynamoDBClient({ region: "eu-north-1" });
  const ddbDocClient = new DynamoDBDocumentClient(client);

  try {
    switch (routeKey) {
      case "GET /items":
        const command = new ScanCommand(dbParams);
        const { Items } = await ddbDocClient.send(command);
        returnObject = { items: Items };
        break;
      case "POST /items":
        break;
      case "GET /items/{itemId}":
        break;
      case "DELETE /items/{itemId}":
        break;
      case "PATCH /items/{itemId}":
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
