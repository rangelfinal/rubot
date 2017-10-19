export default class FacebookElement {
  public title: string;
  public subtitle?: string;
  public imageURL?: string;

  constructor(title: string, subtitle: string, imageURL?: string) {
    this.title = title;
    this.subtitle = subtitle;
    this.imageURL = imageURL;
  }

  /**
   * Formats the element to be included in the payload
   * @return {object} The formated element
   */
  public format(): object {
    return {
      image_url: this.imageURL,
      subtitle: this.subtitle,
      title: this.title,
    };
  }
}