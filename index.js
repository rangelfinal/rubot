const express = require('express');
const bodyParser = require('body-parser');
const { getNextMenu, facebookMenu } = require('./ufscar');

const app = express();

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));

app.post('/fulfillment', (req, res) => {
  console.log(`Request headers: ${JSON.stringify(req.headers)}`);
  console.log(`Request body: ${JSON.stringify(req.body)}`);

  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse(responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      const responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      res.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      const responseJson = {};

      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;

      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.richResponses;

      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.outputContexts;

      res.json(responseJson); // Send response to Dialogflow
    }
  }

  // An action is a string used to identify what needs to be done in fulfillment
  const { action } = req.body.result; // https://dialogflow.com/docs/actions-and-parameters

  // Parameters are any entites that Dialogflow has extracted from the request.
  const { parameters } = req.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters

  // Contexts are objects used to track and store conversation state
  const inputContexts = req.body.result.contexts; // https://dialogflow.com/docs/contexts

  // Get the request source (Google Assistant, Slack, API, etc) and initialize DialogflowApp
  const requestSource = (req.body.originalRequest) ? req.body.originalRequest.source : undefined;

  const actionHandlers = {
    'input.cardapio': () => {
      const responseToUser = {};
      responseToUser.speech = 'falado';
      responseToUser.displayText = 'escrito';
      responseToUser.richResponses = {};
      facebookMenu().then((attachment) => {
        responseToUser.richResponses = { facebook: { attachment } };
        sendResponse(responseToUser);
      });

      /* let reply = '';
      getNextMenu().then((menu) => {
        for (let i = 0; i < menu.length; i += 1) {
          reply += `${menu[i].title} ${menu[i].content}\n`;
        }
        sendResponse(reply);
      }); */
    },
  };

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
});

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});
