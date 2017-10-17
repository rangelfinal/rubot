const cheerio = require('cheerio');
const request = require('request-promise');
const moment = require('moment-timezone');
const getGoogleImage = require('./googleImage');

class UfscarMenu {
  constructor(mealType) {
    this.mealType = mealType;

    this.clean();
  }

  static getNextMeal() {
    if (moment().tz('America/Sao_Paulo').hour() < 14) {
      return 'lunch';
    }
    return 'dinner';
  }

  clean() {
    this.undefinedMenu = true;
    this.mealDiv = null;
    this.rawMenuContents = [];
    this.menuContentsWithImages = [];
    this.fbMenuContents = null;
    this.telegramMenuContents = null;
    this.slackMenuContents = null;
    this.googleAssistantMenuContents = null;
    this.genericMenuContents = null;
    this.responseJSON = null;
  }

  update() {
    if (this.undefinedMenu) {
      this.clean();

      return this.crawlUFSCarSite(this.mealType).then(() => {
        this.structureMenuContents();
        return this.addImagesToPrincipalDishes().then(() => {
          this.getFBMenuContents();
          this.getTelegramMenuContents();
          this.getSlackMenuContents();
          this.getGoogleAssistantMenuContents();
          this.getGenericMenuContents();
          return this.getResponseJSON();
        });
      });
    }
    return Promise.resolve(this.responseJSON);
  }

  crawlUFSCarSite(lunchOrDinner) {
    if (this.mealDiv) return this.mealDiv;

    return request('http://www2.ufscar.br/restaurantes-universitario').then((body) => {
      const $ = cheerio.load(body);

      if (lunchOrDinner === 'lunch') {
        this.mealDiv = $('#cardapio').children().first().find('div');
      } else {
        this.mealDiv = $('#cardapio').children().last().find('div');
      }

      return this.mealDiv;
    });
  }

  structureMenuContents() {
    if (this.rawMenuContents && this.rawMenuContents.length > 0) { return this.rawMenuContents; }

    let undefinedCounter = 0;

    this.mealDiv.children().not('.cardapio_titulo').has('span').each((index, el) => {
      const title = cheerio(el).children('b').text();
      const content = cheerio(el).children('span').text();

      console.log(title, content);

      if (content.indexOf('Não Definido') !== -1) {
        undefinedCounter += 1;
      } else if (content.indexOf('/')) {
        const contentArray = content.split('/');
        for (let i = 0; i < contentArray.length; i += 1) {
          this.rawMenuContents.push({ title, content: contentArray[i] });
        }
      } else {
        this.rawMenuContents.push({ title, content });
      }
    });

    if (undefinedCounter > 3) {
      this.undefinedMenu = true;
      this.rawMenuContents = [{ title: '', content: 'Desculpa, cardápio não definido 😓' }];
    } else {
      this.undefinedMenu = false;
    }
    return this.rawMenuContents;
  }

  menuContentsToString() {
    let menuContentsString = '';
    for (let i = 0; i < this.rawMenuContents.length; i += 1) {
      menuContentsString += `${this.rawMenuContents[i].title} ${this.rawMenuContents[i].content}\n`;
    }
    return menuContentsString;
  }

  addImagesToPrincipalDishes() {
    if (this.menuContentsWithImages && this.menuContentsWithImages.length > 0) { return this.menuContentsWithImages; }

    const promises = [];

    for (let i = 0; i < this.rawMenuContents.length; i += 1) {
      if (this.rawMenuContents[i].title.indexOf('Principal') !== -1) {
        promises.push(getGoogleImage(this.rawMenuContents[i].content)
          .then((imageURL) => {
            this.menuContentsWithImages.push({
              title: this.rawMenuContents[i].title,
              content: this.rawMenuContents[i].content,
              imageURL,
            });
          }));
      } else {
        this.menuContentsWithImages.push(this.rawMenuContents[i]);
      }
    }

    return Promise.all(promises).catch(() => { this.menuContentsWithImages = []; });
  }

  getFBMenuContents() {
    if (this.fbMenuContents) return this.fbMenuContents;

    if (this.undefinedMenu || !this.menuContentsWithImages || this.menuContentsWithImages.length === 0) {
      this.fbMenuContents = null;
      return null;
    }

    this.fbMenuContents = {
      attachment: {
        type: 'list',
        payload: {
          template_type: 'list',
          elements: [],
        },
      },
    };

    let counter = 0;
    const commonElement = { title: '.', subtitle: '' };

    for (let i = 0; i < this.menuContentsWithImages.length; i += 1) {
      if (this.fbMenuContents.attachment.payload.elements.length >= 4) break;
      if (this.menuContentsWithImages[i].imageURL) {
        this.fbMenuContents.attachment.payload.elements.push({
          title: this.menuContentsWithImages[i].title,
          subtitle: this.menuContentsWithImages[i].content,
          image_url: this.menuContentsWithImages[i].imageURL,
        });
      } else if (counter < 2) {
        counter += 1;
        commonElement.subtitle += this.menuContentsWithImages[i].content;
      } else {
        counter = 0;
        this.fbMenuContents.attachment.payload.elements.push(commonElement);
        commonElement.subtitle = '';
      }
    }

    if (commonElement.subtitle !== '' && this.fbMenuContents.attachment.payload.elements.length < 4) { this.fbMenuContents.attachment.payload.elements.push(commonElement); }

    return this.fbMenuContents;
  }

  getTelegramMenuContents() {
    if (this.telegramMenuContents) return this.telegramMenuContents;

    if (this.undefinedMenu || !this.menuContentsWithImages || this.menuContentsWithImages.length === 0) {
      this.telegramMenuContents = null;
      return null;
    }

    // TODO

    return null;
  }

  getSlackMenuContents() {
    if (this.slackMenuContents) return this.slackMenuContents;

    if (this.undefinedMenu || !this.menuContentsWithImages || this.menuContentsWithImages.length === 0) {
      this.slackMenuContents = null;
      return null;
    }

    // TODO

    return null;
  }

  getGoogleAssistantMenuContents() {
    if (this.googleAssistantMenuContents) return this.googleAssistantMenuContents;

    if (this.undefinedMenu || !this.menuContentsWithImages || this.menuContentsWithImages.length === 0) {
      this.googleAssistantMenuContents = null;
      return null;
    }

    // TODO

    return null;
  }

  getGenericMenuContents() {
    if (this.genericMenuContents) return this.genericMenuContents;

    this.genericMenuContents = this.menuContentsToString();
    return this.genericMenuContents;
  }

  getResponseJSON() {
    if (this.responseJSON) return this.responseJSON;

    this.responseJSON = {
      speech: this.getGenericMenuContents(),
      displayText: this.getGenericMenuContents(),
      data: {},
      contextOut: [{ meal: this.mealType }],
      source: 'UFSCar',
    };

    if (this.getFBMenuContents()) this.responseJSON.data.facebook = this.getFBMenuContents();
    if (this.getTelegramMenuContents()) this.responseJSON.data.facebook = this.getTelegramMenuContents();
    if (this.getSlackMenuContents()) this.responseJSON.data.facebook = this.getSlackMenuContents();
    if (this.getGoogleAssistantMenuContents()) this.responseJSON.data.facebook = this.getGoogleAssistantMenuContents();

    return this.responseJSON;
  }
}

const lunchMenu = new UfscarMenu('lunch');
const dinnerMenu = new UfscarMenu('dinner');

module.exports = { UfscarMenu, lunchMenu, dinnerMenu };
