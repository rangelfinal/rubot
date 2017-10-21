import BotkitMiddlewareWatson = require('botkit-middleware-watson');

const watsonMiddleware = BotkitMiddlewareWatson({
  password: YOUR_CONVERSATION_PASSWORD,
  username: YOUR_CONVERSATION_USERNAME,
  version_date: '2017-05-26',
  workspace_id: YOUR_WORKSPACE_ID,
});

export default watsonMiddleware;
