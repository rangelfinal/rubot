import Facebook from './facebook';
import Platform from './platform';

export default class MenuFactory {
  public static getPlatform(platform: string, ...args): Platform {

    const platformDictonary = {
      facebook: Facebook,
    };

    return new platformDictonary[platform](...args);
  }
}
