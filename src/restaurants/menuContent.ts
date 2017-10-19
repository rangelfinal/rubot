import * as Promise from 'bluebird';
import getGoogleImage from '../utils/googleImage';
import logger from '../utils/logger';

export default class MenuContent {
  public title: string;
  public content: string;
  public imageURL?: string;

  /**
   * Create a new MenuContent
   * @param  {string} title    The title of the new MenuContent
   * @param  {string} content  The content of the new MenuContent
   * @param  {string} imageURL A URL with a image represetating the new MenuContent
   * @return {MenuContent}     The new MenuContent
   */
  constructor(title: string, content: string, imageURL?: string) {
    this.title = title;
    this.content = content;
    this.imageURL = imageURL;
  }

  /**
   * Get the first image from Google Images using the content
   * @return {Promise<boolean>} A Promise that return true if everything went right
   */
  public getImage(): Promise<boolean> {
    return getGoogleImage(this.content)
      .then((imageURL) => {
        this.imageURL = imageURL;
        return true;
      }).catch((err) => {
        logger.error(err);
        return false;
      });
  }
}
