import * as Botkit from 'botkit';
import * as util from 'util';
import logger from '../utils/logger';
import Actions from './actions';
import watsonMiddleware from './watson';

const slackConfig = {
  clientId: process.env.SLACKCLIENTID,
  clientSecret: process.env.SLACKCLIENTSECRET,
  require_delivery: true,
  scopes: ['bot'],
};
const slackController = Botkit.slackbot(slackConfig);

const slackBotConfig = {
  token: process.env.SLACKBOTTOKEN,
};
const slackBot = slackController.spawn(slackBotConfig);

slackController.middleware.receive.use(watsonMiddleware.receive);

slackBot.startRTM();

slackController.hears(['.*'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  if (message.watsonError) {
    bot.reply(message, `Desculpe, mas um problema técnico me impediu de responder sua mensagem.
      Tente novamente mais tarde!`);
    logger.error(util.inspect(message.watsonError));
  } else {
    // Log all messages from Watson
    for (const logMessage of message.watsonData.output.log_messages) {
      logger.log(logMessage.level, logMessage.msg);
    }

    // For every intent, run an action
    for (const intent of message.watsonData.intents) {
      // But only if the action exists
      if (Actions[intent.intent]) { Actions[intent.intent](bot, message); }
    }

    // Only send an awnser if watson has one
    if (message.watsonData.output.text) { bot.reply(message, message.watsonData.output.text.join('\n')); }
  }
});

export { slackController, slackBot };
