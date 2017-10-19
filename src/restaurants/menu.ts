import * as Promise from 'bluebird';
import * as moment from 'moment';
import * as util from 'util';
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

  /**
   * Save the mealType and creates de redisKeyPrefix.
   * @param  {string} mealType Type of meal this menu shows
   * @return {Menu}            A represetation of a menu
   */
  constructor(mealType?: string) {
    this.mealType = mealType ? mealType : this.getMealType();
  }

  /**
   * Get a prefix that should be unique to indentify the menu in Redis
   * @return {string} The key prefix
   */
  public abstract getRedisKeyPrefix(): string;

  /**
   * Update the menu. May not update if it's updated already.
   * @param  {boolean}          force True if should force update.
   * @return {Promise<IResponseJSON>} A promise that returns the correct formated JSON response
   */
  public update(force?: boolean): Promise<IResponseJSON> {
    if (force || !this.defined) {
      logger.info(`Updating ${this.mealType} of ${this.restaurantName}`);
      return this.getFromRedis().then((result) => {
        if (!result) {
          return this.updateMenuContents(force).then((menuContents) => {
            this.menuContents = menuContents;
            return this.menuContents.getImages(this.imageTitleFilter, this.imageContentFilter)
              .then(() => {
                this.saveToRedis();
                this.facebookMenuContents = new FacebookList(this.menuContents.elements);
                return this.format();
              });
          });
        }
        return this.menuContents.getImages(this.imageTitleFilter, this.imageContentFilter)
          .then(() => {
            this.facebookMenuContents = new FacebookList(this.menuContents.elements);
            return this.format();
          });
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
    logger.debug('Saving to Redis');
    Redis.setValue(this.getRedisKeyPrefix() + 'defined', this.defined);
    Redis.setValue(this.getRedisKeyPrefix() + 'lastUpdate', moment().toISOString());
    logger.debug(util.inspect(this.menuContents));
    logger.debug(util.inspect(this.menuContents.elements));
    Redis.setValue(this.getRedisKeyPrefix() + 'menuContents:hasImages', this.menuContents.hasImages);
    Redis.setObjectArray(this.getRedisKeyPrefix() + 'menuContents:elements', this.menuContents.elements as object[]);
  }

  /**
   * Get the menu contents from Redis.
   * @return {Promise<boolean>} A promise that returns true if everything went right.
   */
  public getFromRedis(): Promise<boolean> {
    logger.debug('Getting from Redis');

    this.menuContents = new MenuContents();

    return Redis.getValue(this.getRedisKeyPrefix() + 'lastUpdate').then((lastUpdate) => {
      // No data
      if (!lastUpdate) { return false; }

      // Data is stale, should update
      if (moment().diff(moment(lastUpdate)) > 60 * 60 * 1000) { return false; }

      const promises = [];

      promises.push(
        Redis.getValue(this.getRedisKeyPrefix() + 'defined').then((defined) => {
          this.defined = !!defined;
        }),
      );

      promises.push(
        Redis.getValue(this.getRedisKeyPrefix() + 'menuContents:hasImages').then((hasImages) => {
          this.menuContents.hasImages = !!hasImages;
        }),
      );

      promises.push(
        Redis.getObjectArray(this.getRedisKeyPrefix() + 'menuContents:elements')
        .then((contents: {title, content, imageURL?}[]) => {
          for (const content of contents) {
            this.menuContents.elements.push(
              new MenuContent(content.title, content.content, content.imageURL),
            );
          }
        }),
      );

      // Returns a promise that fulfills when all other promises complete
      return Promise.all(promises)
        .then(() => true)
        .catch((err) => {
          logger.error(err);
          return false;
        });
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
