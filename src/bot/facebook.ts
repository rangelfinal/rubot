import * as Botkit from 'botkit';
import watsonMiddleware from './watson';

const facebookConfig = {
  access_token: process.env.FACEBOOKACCESSTOKEN,
  require_delivery: true,
  verify_token: process.env.FACEBOOKVERIFYTOKEN,
};

const facebookController = Botkit.facebookbot(facebookConfig);

const facebookBot = facebookController.spawn();

facebookController.middleware.receive.use(watsonMiddleware.receive);

facebookController.api.messenger_profile.greeting('Olá! Obrigado por me testar <3');

export { facebookController, facebookBot };
