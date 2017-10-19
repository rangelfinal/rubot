import Menu from './menu';
import UFSCarSaoCarlosMenu from './ufscarsaocarlos';

export default class MenuFactory {
  public static getMenu(restaurant: string, ...args): Menu {

    const menuDictonary = {
      ufscarsaocarlos: UFSCarSaoCarlosMenu,
    };

    return new menuDictonary[restaurant](...args);
  }
}
