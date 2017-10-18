const express = require('express');
import { UfscarMenu, lunchMenu, dinnerMenu } from "../ufscar/ufscar";
import { sendResponse } from './utils';
import { Notification } from '../db';
const moment = require('moment');

const router = express.Router();

router.post('/fulfillment', (req, res) => {
  console.log(`Request headers: ${JSON.stringify(req.headers)}`);
  console.log(`Request body: ${JSON.stringify(req.body)}`);

  const { action } = req.body.result; // https://dialogflow.com/docs/actions-and-parameters
  const { parameters } = req.body.result; // https://dialogflow.com/docs/actions-and-parameters
  const inputContexts = req.body.result.contexts; // https://dialogflow.com/docs/contexts
  const requestSource = (req.body.originalRequest) ? req.body.originalRequest.source : undefined;

  let sender = null;
  if (requestSource === 'telegram') sender = inputContexts[0].parameters.telegram_chat_id;
  if (requestSource === 'facebook') sender = inputContexts[0].parameters.facebook_sender_id;

  const actionHandlers = {
    'input.getMenu': () => {
      const mealType = parameters.mealType || UfscarMenu.getNextMeal();
      if (mealType === 'lunch') {
        lunchMenu.update().then((responseJSON) => {
          console.dir(responseJSON);
          res.json(responseJSON);
        });
      } else {
        dinnerMenu.update().then((responseJSON) => {
          console.dir(responseJSON);
          res.json(responseJSON);
        });
      }
    },

    'input.changeNotification': () => {
      Notification.destroy({ where: { target: sender } }).then(() => {
        const promises = [];
        const date1 = Object.values(parameters.date1);
        for (let i = 0; i < date1.length; i += 1) {
          const p = Notification.create({
            target: sender,
            mealType: parameters.mealType1,
            dayOfTheWeek: moment(date1[i]).day(),
          });
          promises.push(p);
        }

        if (parameters.date2 && parameters.mealType2) {
          const date2 = Object.values(parameters.date2);
          for (let i = 0; i < date2.length; i += 1) {
            const p = Notification.create({
              target: sender,
              mealType: parameters.mealType1,
              dayOfTheWeek: moment(date2[i]).day(),
            });
            promises.push(p);
          }
        }

        return Promise.all(promises);
      }).then(() => res.json(sendResponse('Configurações de notificação salvas no banco de dados!')))
        .catch((err) => {
          res.json(sendResponse('Desculpe, ocorreu um erro quando tentei salvar suas configurações de notificação :('));
          console.error(err);
        });
    },

    'input.changeUniversity': () => {
      if (parameters.university !== 'ufscar' || parameters.campus !== 'são carlos') {
        sendResponse('Desculpe, esse bot só funciona para a UFSCar São Carlos por enquanto :(');
      }
    },
  };

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
});

export default router;
