import cheerio from 'cheerio';
import request from 'request-promise';
import moment from 'moment-timezone';
import getGoogleImage from './googleImage';
import { redis } from '../db';


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
      console.log('Menu is undefined, updating...');
      this.clean();

      return this.getFromRedis().then((res) => {
        if (!res) {
          console.log('Redis is outdated, getting info from website...');
          return this.updateFromSite();
        }

        console.log('Updating templates with Redis data');

        this.updateTemplates();
        return this.getResponseJSON();
      }).catch((err) => {
        console.log('Error getting data from redis, updating from website...');
        console.err(err);
        this.updateFromSite();
      });
    }
    return Promise.resolve(this.responseJSON);
  }

  updateFromSite() {
    console.log('Updating from website');
    return this.crawlUFSCarSite(this.mealType).then(() => {
      this.structureMenuContents();
      return this.addImagesToPrincipalDishes().then(() => {
        this.save();
        this.updateTemplates();
        return this.getResponseJSON();
      });
    });
  }

  updateTemplates() {
    console.log('Updating templates');
    this.getFBMenuContents();
    this.getTelegramMenuContents();
    this.getSlackMenuContents();
    this.getGoogleAssistantMenuContents();
    this.getGenericMenuContents();
  }

  getFromRedis() {
    console.log('Getting data from Redis');
    return redis.getAsync(`${this.mealType}:lastUpdate`).then((res) => {
      if (!res) {
        console.log('No lastUpdate key on redis');
        return false; // Se não tem chave, não puxar do Redis
      }
      if (moment().diff(moment(res)) > 1000 * 60 * 60) {
        console.log('Redis data is stale');
        return false; // Se tem mais de uma hora de vida, não puxar do Redis
      }

      const promises = [];

      promises.push(redis.getAsync(`${this.mealType}:undefinedMenu`).then((gres) => {
        this.undefinedMenu = gres;
      }));

      promises.push(redis.getAsync(`${this.mealType}:mealDiv`).then((gres) => {
        if (gres) this.mealDiv = cheerio(gres);
      }));

      promises.push(redis.lrangeAsync(`${this.mealType}:rawMenuContents`, 0, -1).then((lres) => {
        const listPromises = [];

        for (let i = 0; i < lres.length; i += 1) {
          this.rawMenuContents[i] = {};
          listPromises.push(redis.hgetAsync(lres[i], 'title').then((hres) => {
            this.rawMenuContents[i].title = hres;
          }));
          listPromises.push(redis.hgetAsync(lres[i], 'content').then((hres) => {
            this.rawMenuContents[i].content = hres;
          }));
        }

        return Promise.all(listPromises);
      }));

      promises.push(redis.lrangeAsync(`${this.mealType}:menuContentsWithImages`, 0, -1).then((lres) => {
        const listPromises = [];

        for (let i = 0; i < lres.length; i += 1) {
          this.menuContentsWithImages[i] = {};
          listPromises.push(redis.hgetAsync(lres[i], 'title').then((hres) => {
            this.menuContentsWithImages[i].title = hres;
          }));
          listPromises.push(redis.hgetAsync(lres[i], 'content').then((hres) => {
            this.menuContentsWithImages[i].content = hres;
          }));
          listPromises.push(redis.hgetAsync(lres[i], 'imageURL').then((hres) => {
            if (lres) this.menuContentsWithImages[i].imageURL = hres;
          }));
        }

        return Promise.all(listPromises);
      }));

      return Promise.all(promises).then(() => true);
    });
  }

  save() {
    console.log(`Saving ${this.mealType} data to redis`);

    const promises = [];

    promises.push(redis.setAsync(`${this.mealType}:undefinedMenu`, this.undefinedMenu));

    if (this.mealDiv) promises.push(redis.setAsync(`${this.mealType}:mealDiv`, this.mealDiv.toString()));

    if (this.rawMenuContents && this.rawMenuContents.length > 0) {
      for (let i = 0; i < this.rawMenuContents.length; i += 1) {
        promises.push(redis.hsetAsync(`${this.mealType}:rawMenuContents:${i}`, 'title', this.rawMenuContents[i].title));
        promises.push(redis.hsetAsync(`${this.mealType}:rawMenuContents:${i}`, 'content', this.rawMenuContents[i].content));
        promises.push(redis.rpushAsync(`${this.mealType}:rawMenuContents`, `${this.mealType}:rawMenuContents:${i}`));
      }
    }

    if (this.menuContentsWithImages && this.menuContentsWithImages.length > 0) {
      for (let i = 0; i < this.menuContentsWithImages.length; i += 1) {
        promises.push(redis.hsetAsync(`${this.mealType}:menuContentsWithImages:${i}`, 'title', this.menuContentsWithImages[i].title));
        promises.push(redis.hsetAsync(`${this.mealType}:menuContentsWithImages:${i}`, 'content', this.menuContentsWithImages[i].content));
        if (this.menuContentsWithImages[i].imageURL) { promises.push(redis.hsetAsync(`${this.mealType}:menuContentsWithImages:${i}`, 'imageURL', this.menuContentsWithImages[i].imageURL)); }
        promises.push(redis.rpushAsync(`${this.mealType}:menuContentsWithImages`, `${this.mealType}:menuContentsWithImages:${i}`));
      }
    }

    promises.push(redis.setAsync(`${this.mealType}:lastUpdate`, moment().toISOString()));

    return Promise.all(promises);
  }

  crawlUFSCarSite(lunchOrDinner) {
    if (this.mealDiv) return this.mealDiv;
    console.log(`Crawling website to get ${this.mealType} data`);

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
    console.log('Structuring Menu Contents');

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
    console.log(`Adding images to principal ${this.mealType} dishes`);

    const promises = [];

    for (let i = 0; i < this.rawMenuContents.length; i += 1) {
      if (this.rawMenuContents[i].title.indexOf('Principal') !== -1) {
        promises.push(getGoogleImage(this.rawMenuContents[i].content)
          .then(imageURL => ({
            title: this.rawMenuContents[i].title,
            content: this.rawMenuContents[i].content,
            imageURL,
          })));
      } else {
        promises.push(Promise.resolve(this.rawMenuContents[i]));
      }
    }

    return Promise.all(promises)
      .then((elements) => {
        this.menuContentsWithImages = elements;
      })
      .catch((err) => {
        console.error(err);
        this.menuContentsWithImages = [];
      });
  }

  getFBMenuContents() {
    if (this.fbMenuContents) return this.fbMenuContents;
    console.log(`Updating ${this.mealType} facebook template`);

    if (this.undefinedMenu || !this.menuContentsWithImages || this.menuContentsWithImages.length === 0) {
      this.fbMenuContents = null;
      return null;
    }

    this.fbMenuContents = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          elements: [],
        },
      },
    };

    let counter = 0;
    let title = '';
    let subtitle = '';

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
        title += `${this.menuContentsWithImages[i].title.replace(':', '')}`;
        if (counter === 1) title += '/';
        subtitle += `${this.menuContentsWithImages[i].title} ${this.menuContentsWithImages[i].content}\n`;
      } else {
        counter = 0;
        this.fbMenuContents.attachment.payload.elements.push({ title, subtitle });
        title = '';
        subtitle = '';
      }
    }

    if (subtitle !== '' && this.fbMenuContents.attachment.payload.elements.length < 4) { this.fbMenuContents.attachment.payload.elements.push({ title, subtitle }); }

    return this.fbMenuContents;
  }

  getTelegramMenuContents() {
    if (this.telegramMenuContents) return this.telegramMenuContents;
    console.log(`Updating ${this.mealType} telegram template`);

    if (this.undefinedMenu || !this.menuContentsWithImages || this.menuContentsWithImages.length === 0) {
      this.telegramMenuContents = null;
      return null;
    }

    // TODO

    return null;
  }

  getSlackMenuContents() {
    if (this.slackMenuContents) return this.slackMenuContents;

    console.log(`Updating ${this.mealType} slack template`);

    if (this.undefinedMenu || !this.menuContentsWithImages || this.menuContentsWithImages.length === 0) {
      this.slackMenuContents = null;
      return null;
    }

    // TODO

    return null;
  }

  getGoogleAssistantMenuContents() {
    if (this.googleAssistantMenuContents) return this.googleAssistantMenuContents;

    console.log(`Updating ${this.mealType} google assistant template`);

    if (this.undefinedMenu || !this.menuContentsWithImages || this.menuContentsWithImages.length === 0) {
      this.googleAssistantMenuContents = null;
      return null;
    }

    // TODO

    return null;
  }

  getGenericMenuContents() {
    if (this.genericMenuContents) return this.genericMenuContents;

    console.log(`Updating ${this.mealType} generic template`);

    this.genericMenuContents = this.menuContentsToString();
    return this.genericMenuContents;
  }

  getResponseJSON() {
    if (this.responseJSON) return this.responseJSON;

    console.log(`Updating ${this.mealType} json`);

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

export { UfscarMenu, lunchMenu, dinnerMenu };
