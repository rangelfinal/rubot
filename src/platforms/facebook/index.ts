import MenuContent from '../../restaurants/menuContent';
import MenuContents from '../../restaurants/menuContents';
import Platform from '../platform';
import botly from './botly';

export default class Facebook extends Platform {
  public sendText(text: string, target: string): Promise<any> {
    return botly.sendText({ text, id: target });
  }
  public sendRichMessage(target: string, ...args): Promise<any> {
    return botly.send({ id: target, ...args });
  }

  public sendMenuContents(menuContents: MenuContents, target: string) {
    const listElements = [];

    for (const menuContent of menuContents.elements) {
      let shouldConcat: boolean;

      const subtitleLenghtIfConcat: number = listElements[listElements.length - 1].subtitle.length +
        menuContent.title.length + ': '.length +
        menuContent.content.length;

      shouldConcat = !menuContent.imageURL &&
        listElements[listElements.length - 1] &&
        listElements[listElements.length - 1].subtitle &&
        !listElements[listElements.length - 1].imageURL &&
        subtitleLenghtIfConcat < 80;

      if (shouldConcat) {
        listElements[listElements.length - 1].title += '/' + menuContent.title;
        listElements[listElements.length - 1].subtitle += '\n' + menuContent.title + ': ' + menuContent.content;
      } else {
        const newElement = botly.createListElement({
          subtitle: menuContent.content,
          title: menuContent.title,
        });

        if (menuContent.imageURL) { newElement.image_url = menuContent.imageURL; }

        listElements.push(newElement);
      }
    }

    botly.sendList({ id: target, elements: listElements });
  }
}
