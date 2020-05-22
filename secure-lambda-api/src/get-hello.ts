const AWS = require('aws-sdk');

export const handler = async (event: any = {}) : Promise <any> => {

  const requestedItemId = event.pathParameters.id;
  if (!requestedItemId) {
    return { statusCode: 400, body: `Error: You are missing the path parameter id` };
  }

  try {
    return { statusCode: 200, body: "Hello " + requestedItemId + "!"};
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};