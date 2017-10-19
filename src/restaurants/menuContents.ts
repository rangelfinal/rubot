import MenuContent from './menuContent';

export default class MenuContents {
  public elements: MenuContent[] = [];
  public hasImages: boolean = false;

  /**
   * An optional constructor that creates a new MenuContents with it's elements.
   * @param  {MenuContent[]} elements An array of MenuContent
   * @return {[type]}                 The new MenuContents
   */
  constructor(elements?: MenuContent[]) {
    if (elements) { this.elements = elements; }
  }

  /**
   * Get images to represent the contents of the menu.
   * @param  {string}           titleFilter   Only get images on elements with a title that contains this string.
   * @param  {string}           contentFilter Only get images on elements with a content that contains this string.
   * @return {Promise<boolean>}               A promise that returns true if everything went right.
   */
  public getImages(titleFilter?: string, contentFilter?: string): Promise<boolean> {
    if (this.hasImages) { return Promise.resolve(true); }

    const promises = [];

    for (const element of this.elements) {
      if (titleFilter && element.title.indexOf(titleFilter) === -1) {
        continue;
      }

      if (contentFilter && element.content.indexOf(contentFilter) === -1) {
        continue;
      }

      promises.push(
        element.getImage(),
      );
    }

    // Returns a promise that fulfills when every element got it's image.
    return Promise.all(promises)
      .then(() => {
        this.hasImages = true;
        return true;
      })
      .catch(err => {
        console.error(err);
        this.hasImages = false;
        return false;
      });
  }

  /**
   * Converts this to a string
   * @param  {string} titleFilter   Only include elements with a title that contains this.
   * @param  {string} contentFilter Only include elements with a content that contains this.
   * @return {string}               A string represetation of all elements
   */
  public toString(titleFilter?: string, contentFilter?: string): string {
    let returnString = '';

    for (const element of this.elements) {
      if (titleFilter && element.title.indexOf(titleFilter) !== -1) {
        continue;
      }

      if (contentFilter && element.content.indexOf(contentFilter) === -1) {
        continue;
      }

      returnString += element.title + ': ' + element.content + '\n';
    }

    return returnString;
  }
}
