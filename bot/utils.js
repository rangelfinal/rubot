// Function to send correctly formatted responses to Dialogflow which are then sent to the user
function sendResponse(responseToUser) {
  // if the response is a string send it as a response to the user
  if (typeof responseToUser === 'string') {
    const responseJson = {};
    responseJson.speech = responseToUser; // spoken response
    responseJson.displayText = responseToUser; // displayed response
    return responseJson; // Send response to Dialogflow
  }
  // If the response to the user includes rich responses or contexts send them to Dialogflow
  const responseJson = {};

  // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
  responseJson.speech = responseToUser.speech || responseToUser.displayText;
  responseJson.displayText = responseToUser.displayText || responseToUser.speech;

  // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
  responseJson.data = responseToUser.richResponses;

  // Optional: add contexts (https://dialogflow.com/docs/contexts)
  responseJson.contextOut = responseToUser.outputContexts;

  return responseJson; // Send response to Dialogflow
}

module.exports = { sendResponse };
