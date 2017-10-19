export interface IResponseToUser {
  speech: string;
  displayText: string;
  richResponses?: object;
  outputContexts?: object;
}

export interface IResponseJSON {
  speech: string;
  displayText: string;
  data?: object;
  contextOut?: object;
}

export default class Dialogflow {
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  public static sendResponse(responseToUser: string | IResponseToUser): IResponseJSON {
    const responseJson: IResponseJSON = {
      displayText: '',
      speech: '',
    };

    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      responseJson.displayText = responseToUser;
      responseJson.speech = responseToUser;
      return responseJson; // Send response to Dialogflow
    }

    // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
    responseJson.speech = responseToUser.speech || responseToUser.displayText;
    responseJson.displayText = responseToUser.displayText || responseToUser.speech;

    // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
    responseJson.data = responseToUser.richResponses;

    // Optional: add contexts (https://dialogflow.com/docs/contexts)
    responseJson.contextOut = responseToUser.outputContexts;

    return responseJson; // Send response to Dialogflow
  }
}
