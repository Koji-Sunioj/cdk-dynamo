const statusHandler = (httpStatusCode, message) => {
  if (httpStatusCode === 200) {
    returnObject = { message: message };
    return returnObject;
  } else {
    throw new Error("could not create new item with those values");
  }
};

module.exports = { statusHandler };
