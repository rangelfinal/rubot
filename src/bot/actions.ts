import * as util from 'util';
import PlatformFactory from '../platforms/platformFactory';
import Menu from '../restaurants/menu';
import MenuFactory from '../restaurants/menuFactory';
import logger from '../utils/logger';
import { IWitEntities } from './wit';

export default class Actions {
  public static 'menu_get'(entities: IWitEntities, platformName: string, target: string): void {
    logger.debug('Getting menu');
    let menu: Menu;

    // TODO: add other restaurants
    if (entities.meal_type) {
      menu = MenuFactory.getMenu('ufscarsaocarlos', entities.meal_type.value);
    } else {
      menu = MenuFactory.getMenu('ufscarsaocarlos');
    }

    menu.update().then(() => {
      const platform = PlatformFactory.getPlatform(platformName);
      platform.sendMenuContents(menu.menuContents, target);
    });
  }

  public static 'promptRestaurant'(entities: IWitEntities, platformName: string, target: string): void {
    const platform = PlatformFactory.getPlatform(platformName);

    const messages = [
      'Qual o restaurante?',
    ];

    platform.sendText(
      messages[Math.floor(Math.random() * messages.length)],
      target,
    );
  }

  public static 'fallback'(entities: IWitEntities, platformName: string, target: string) {
    const platform = PlatformFactory.getPlatform(platformName);

    const messages = [
      'Desculpe, não consegui entender sua mensagem :(',
      'Não consegui entender. Tente escrever de outra forma!',
      'Desculpa, não consegui entender',
      'Ainda não aprendi o que isso significa. Tente escrever de outra forma!',
    ];

    platform.sendText(
      messages[Math.floor(Math.random() * messages.length)],
      target,
    );
  }
}
