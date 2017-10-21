import * as Promise from 'bluebird';
import { FacebookBot, SlackBot } from 'botkit';
import * as util from 'util';
import { User } from '../db';
import Menu from '../restaurants/menu';
import MenuFactory from '../restaurants/menuFactory';
import logger from '../utils/logger';
import watsonMiddleware from './watson';

function isFacebookBot(object: any): object is FacebookBot {
  return 'replyWithTyping' in object && 'startTyping' in object && 'stopTyping' in object;
}

function isSlackBot(object: any): object is SlackBot {
  return 'startRTM' in object && 'closeRTM' in object;
}

export default class Actions {
  public static 'getMenu'(bot, message) {
    // Try and find mealType in the entities
    const mealTypeEntity = message.watsonData.entities.find((entity) => {
      return entity.entity === 'mealType';
    });

    // Try and find restaurant in the entities
    const restaurantEntity = message.watsonData.entities.find((entity) => {
      return entity.entity === 'restaurant';
    });

    // If there's no restaurant in the entities, try and get the default one to this user
    if (!restaurantEntity) {
      User.findById(message.user).then((user) => {
        if (!user || !user.defaultRestaurant) {
          bot.reply(`De qual restaurante você quer receber o cardápio?
            Você pode configurar um restaurante padrão!`);
          return;
        }
        restaurantEntity.value = user.defaultRestaurant;
      });
    }

    let menu: Menu;

    // TODO: add other restaurants
    if (mealTypeEntity) {
      menu = MenuFactory.getMenu(restaurantEntity.value, mealTypeEntity.value);
    } else {
      menu = MenuFactory.getMenu(restaurantEntity.value);
    }

    menu.update().then(() => {
      if (isFacebookBot(bot)) {
        bot.reply(message, menu.facebookMenuContents());
      } else if (isSlackBot(bot)) {
        bot.reply(message, menu.slackMenuContents());
      } else {
        bot.reply(message, menu.menuContents.toString());
      }

    });

  }
}
