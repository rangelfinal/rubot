import * as util from 'util';
import PlatformFactory from '../platforms/platformFactory';
import Menu from '../restaurants/menu';
import MenuFactory from '../restaurants/menuFactory';
import logger from '../utils/logger';
import { IWitEntities } from './wit';

export default class Actions {
  public 'menu_get'(entities: IWitEntities, platformName: string, target: string): void {
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
}
