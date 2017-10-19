import MenuContents from '../../restaurants/menuContents';
import FacebookElement from './element';

enum TopElementStyleENUM {
  large = 'large',
  compact = 'compact',
}

export default class FacebookListTemplate {
  public topElementStyle: TopElementStyleENUM = TopElementStyleENUM.large;
  public elements: FacebookElement[];

  /**
   * An optional constructor that creates a list based on the MenuContents
   * @param  {MenuContents} menuContents The menu contents to be included in the list
   * @return {FacebookListTemplate}      A new FacebookListTemplate
   */
  constructor(menuContents?: MenuContents) {
    if (menuContents) {
      for (const element of menuContents.elements) {
        this.elements.push(new FacebookElement(
          element.title,
          element.content,
          element.imageURL,
        ));
      }
    }
  }

  /**
   * Formats the list to be sent to facebook
   * @return {object} The payload
   */
  public format(): object {
    // Sort to let the elements with images go first
    const sortedElements: FacebookElement[] = this.elements.sort((a,b) => {
      if (a.imageURL && !b.imageURL) { return -1;}
      if (a.imageURL && b.imageURL) { return 0;}
      if (!a.imageURL && b.imageURL) { return 1;}
    });

    const groupedElements: FacebookElement[] = [];

    for (const element of sortedElements) {

      if (element.imageURL) {
        // If the element have a image, it gets it's own element
        groupedElements.push(element);
      } else {
        // Else, it get's grouped with another element if it's below the 80 characters limit
        if (groupedElements[groupedElements.length - 1].subtitle.length + element.subtitle.length < 80) {
          groupedElements[groupedElements.length - 1].title = '/' + element.title;
          groupedElements[groupedElements.length - 1].subtitle += '\n' + element.subtitle;
        }
      }

      // List have a maximum of 4 elements
      if (groupedElements.length >= 4) { break; }
    }

    return {
      attachment: {
        payload: {
          elements: this.elements.map(el => el.format()),
          template_type: 'list',
          top_element_style: this.topElementStyle,
        },
        type: 'template',
      },
    };
  }
}
