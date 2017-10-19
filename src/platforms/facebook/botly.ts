import * as Botly from 'botly';
import { WitBot } from '../../bot/wit';
import logger from '../../utils/logger';

const botly = new Botly({
  accessToken: process.env.FACEBOOKPAGEACCESSTOKEN, // page access token provided by facebook
  verifyToken:  process.env.FACEBOOKVERIFICATIONTOKEN, // needed when using express
});

botly.on('message', (sender, message, data) => {
  logger.debug(sender);
  logger.debug(message);
  logger.debug(data);
  return WitBot.runAction(message, 'facebook', sender);
    /**
     * where data can be a text message or an attachment
     * data = {
     *   text: "text entered by user"
     * }
     * OR
     * data = {
     *   attachments: {
     *       image: ["imageURL1", "imageURL2"],
     *       video: ["videoURL"],
     *       audio: ["audioURL1"],
     *       location: [{coordinates}]
     *   }
     * }
     */
});

botly.on('postback', (sender, message, postback, ref) => {
    /**
     * where postback is the postback payload
     * and ref will arrive if m.me params were passed on a get started button (if defined)
     */
});

botly.on('error', (ex) => {
    /* handle exceptions */
});

export default botly;
