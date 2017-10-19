import { Router } from 'express';
import * as moment from 'moment';
import { inspect } from 'util';
import { Notification } from '../db';
import { dinnerMenu, lunchMenu } from '../restaurants/ufscar/ufscar';
import logger from '../utils/logger';
import Dialogflow from './dialogflow';

const router = Router();

router.post('/fulfillment', (req, res) => {
  logger.debug(`Request headers: ${JSON.stringify(req.headers)}`);
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  const { action } = req.body.result; // https://dialogflow.com/docs/actions-and-parameters
  const { parameters } = req.body.result; // https://dialogflow.com/docs/actions-and-parameters
  const inputContexts = req.body.result.contexts; // https://dialogflow.com/docs/contexts
  const requestSource = (req.body.originalRequest) ? req.body.originalRequest.source : undefined;

  let sender: string = '';
  if (requestSource === 'telegram') { sender = inputContexts[0].parameters.telegram_chat_id; }
  if (requestSource === 'facebook') { sender = inputContexts[0].parameters.facebook_sender_id;}

  const actionHandlers: object = {
    'input.changeNotification'(): void {
      Notification.destroy({ where: { target: sender } }).then(() => {
        const promises = [];
        for (const date of parameters.date1) {
          promises.push(
            Notification.create({
              dayOfTheWeek: moment(date).day(),
              mealType: parameters.mealType1,
              target: sender,
            }),
          );
        }

        for (const date of parameters.date2) {
          promises.push(
            Notification.create({
              dayOfTheWeek: moment(date).day(),
              mealType: parameters.mealType2,
              target: sender,
            }),
          );
        }

        return Promise.all(promises);
      }).then(() => res.json(Dialogflow.sendResponse('Configurações de notificação salvas no banco de dados!')))
        .catch((err: any) => {
          res.json(Dialogflow.sendResponse('Desculpe, ocorreu um erro quando tentei salvar suas configurações'
          + ' de notificação :('));
          logger.error(err);
        });
    },

    'input.changeUniversity'(): void {
      if (parameters.university !== 'ufscar' || parameters.campus !== 'são carlos') {
        Dialogflow.sendResponse('Desculpe, esse bot só funciona para a UFSCar São Carlos por enquanto :(');
      }
    },

    'input.getMenu'(): void {
      logger.debug('Getting menu');
      const mealType = parameters.mealType;
      if (mealType === 'lunch') {
        lunchMenu.update().then((responseJSON) => {
          logger.debug(responseJSON.toString());
          logger.debug(inspect(responseJSON));
          return res.json(responseJSON);
        });
      } else {
        dinnerMenu.update().then((responseJSON) => {
          logger.debug(responseJSON.toString());
          logger.debug(inspect(responseJSON));
          return res.json(responseJSON);
        });
      }
    },
  };

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action as string]();
});

export default router;
