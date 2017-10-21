import * as Promise from 'bluebird';
import { FacebookMessage, SlackMessage } from 'botkit';
import * as cheerio from 'cheerio';
import * as moment from 'moment-timezone';
import * as request from 'request-promise';
import logger from '../../utils/logger';
import Menu from '../menu';
import MenuContent from '../menuContent';
import MenuContents from '../menuContents';

export default class UFSCarSaoCarlosMenu extends Menu {
  public restaurantName: string = 'UFSCarSaoCarlos';

  public imageTitleFilter: string = 'Principal';
  public imageContentFilter: string = '';

  constructor(mealType?: string) {
    super(mealType);
  }

  public getRedisKeyPrefix(): string {
    return `${this.restaurantName}:${this.mealType}:`;
  }

  public updateMenuContents(force?: boolean): Promise<MenuContents> {
    return request('http://www2.ufscar.br/restaurantes-universitario').then((body) => {
      logger.debug('Crawling UFSCar\'s website');
      const $ = cheerio.load(body);

      let mealDiv;

      if (this.mealType === 'lunch') {
        mealDiv = $('#cardapio').children().first().find('div');
      } else {
        mealDiv = $('#cardapio').children().last().find('div');
      }

      let undefinedCounter = 0;
      const menuContents = new MenuContents();

      mealDiv.children().not('.cardapio_titulo').has('span').each((index, el) => {
        const title = cheerio(el).children('b').text().replace(':', '').trim();
        const rawContent = cheerio(el).children('span').text().trim();

        logger.debug(`Got ${title}: ${rawContent}`);

        if (rawContent.indexOf('Não Definido') !== -1) {
          undefinedCounter += 1;
        } else if (rawContent.indexOf('/')) {
          const contentArray = rawContent.split('/');
          for (const content of contentArray) {
            menuContents.elements.push(
              new MenuContent(title, content),
            );
          }
        } else {
          menuContents.elements.push(
            new MenuContent(title, rawContent),
          );
        }
      });

      this.defined = undefinedCounter < 3;

      return menuContents;
    });
  }

  public getMealType(): string {
    if (moment().tz('America/Sao_Paulo').hour() < 14) {
      return 'lunch';
    }
    return 'dinner';
  }

  public facebookMenuContents(): FacebookMessage {
    const listElements = [];

    for (const menuContent of this.menuContents.elements) {
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
        const newElement: {title: string, subtitle: string, image_url?: string} = {
          subtitle: menuContent.content,
          title: menuContent.title,
        };

        if (menuContent.imageURL) { newElement.image_url = menuContent.imageURL; }

        listElements.push(newElement);

        if (listElements.length >= 4) { break; }
      }
    }

    return {
      attachment: {
        payload: {
          elements: listElements,
          template_type: 'list',
        },
        type: 'template',
      },
    };
  }

  public slackMenuContents(): SlackMessage {
    return { text: this.menuContents.toString() };
  }
}
