import { IResponseJSON } from '../bot/dialogflow';
import { Redis } from '../db';
import FacebookList from '../platforms/facebook/list';
import logger from '../utils/logger';
import MenuContent from './menuContent';
import MenuContents from './menuContents';

export default abstract class Menu {
  // Should be a unique constant on a derived class.
  public restaurantName: string;

  public mealType: string;
  public defined: boolean = false;
  public menuContents: MenuContents = new MenuContents();
  public facebookMenuContents: FacebookList = new FacebookList();
  public telegramMenuContents: any; // TODO
  public googleAssistantMenuContents: any; // TODO

  // Filter which menu elements should get a image.
  // Userfull for facebook list, that only accepts up to 4 elements,
  // and elements with a imageURL aren't grouped.
  public imageTitleFilter: string;
  public imageContentFilter: string;

  private redisKeyPrefix: string;

  /**
   * Save the mealType and creates de redisKeyPrefix.
   * @param  {string} mealType Type of meal this menu shows
   * @return {Menu}            A represetation of a menu
   */
  constructor(mealType?: string) {
    this.mealType = mealType ? mealType : this.getMealType();

    // Set a prefix that should be unique to indentify the menu in Redis
    this.redisKeyPrefix = this.restaurantName + ':' + this.mealType + ':';
  }

  /**
   * Update the menu. May not update if it's updated already.
   * @param  {boolean}          force True if should force update.
   * @return {Promise<IResponseJSON>} A promise that returns the correct formated JSON response
   */
  public update(force?: boolean): Promise<IResponseJSON> {
    if (force || !this.defined) {
      logger.info(`Updating ${this.mealType} of ${this.restaurantName}`);
      this.facebookMenuContents = new FacebookList(this.menuContents);
      return this.updateMenuContents(force).then((menuContents) => {
        this.menuContents = menuContents;
        return this.menuContents.getImages(this.imageTitleFilter, this.imageContentFilter)
          .then(() => this.format());
      });
    }

    return Promise.resolve(this.format());
  }

  /**
   * Update the menu contents.
   * @param  {boolean}               force True if should force update.
   * @return {Promise<MenuContents>}       A promise that returns the menu contents.
   */
  public abstract updateMenuContents(force?: boolean): Promise<MenuContents>;

  /**
   * Return the meal type if it's not defined by the user
   * @return {string} the meal type
   */
  public abstract getMealType(): string;

  /**
   * Save the menu contents to Redis.
   */
  public saveToRedis(): void {
    Redis.setValue(this.redisKeyPrefix + 'defined', this.defined);
    Redis.setObjectArray(this.redisKeyPrefix + 'menuContents', this.menuContents.elements);
  }

  /**
   * Get the menu contents from Redis.
   * @return {Promise<boolean>} A promise that returns true if everything went right.
   */
  public getFromRedis(): Promise<boolean> {
    const promises = [];

    promises.push(
      Redis.getValue(this.redisKeyPrefix + 'defined').then((defined) => {
        this.defined = !!defined;
      }),
    );

    promises.push(
      Redis.getObjectArray(this.redisKeyPrefix + 'menuContents').then((contents) => {
        this.menuContents = new MenuContents(contents as MenuContent[]);
      }),
    );

    // Returns a promise that fulfills when all other promises complete
    return Promise.all(promises)
      .then(() => true)
      .catch((err) => {
        logger.error(err);
        return false;
      });
  }

  public format(): IResponseJSON {
    const responseToUser: IResponseJSON = {
      data: {
        facebook: this.facebookMenuContents.format(),
      },
      displayText: this.menuContents.toString(),
      speech: this.menuContents.toString(),
    };

    return responseToUser;
  }
}
