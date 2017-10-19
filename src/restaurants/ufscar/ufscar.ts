import * as cheerio from 'cheerio';
import * as moment from 'moment-timezone';
import * as request from 'request-promise-native';
import Menu from '../menu';
import MenuContent from '../menuContent';
import MenuContents from '../menuContents';

class UFSCarMenu extends Menu {
  public restaurantName: string = 'UFSCarSaoCarlos';

  public updateMenuContents(force?: boolean): Promise<MenuContents> {
    return request('http://www2.ufscar.br/restaurantes-universitario').then((body) => {
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
}

const lunchMenu = new UFSCarMenu('lunch');
const dinnerMenu = new UFSCarMenu('dinner');

export { UFSCarMenu, lunchMenu, dinnerMenu };
