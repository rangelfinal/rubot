const cheerio = require('cheerio');
const request = require('request-promise');
const getGoogleImage = require('./googleImage');

/**
 * Mapeia o conteúdo da div com o cardápio para um array de itens
 * @param  {CheerioElement} mealDiv Elemento do Cheerio com o cardápio
 * @return {Array<{title: string, content:string}>}         Array de elementos do cardápio
 */
function getMenuContents(mealDiv) {
  let undefinedCounter = 0;
  const menuContents = [];

  mealDiv.children().not('.cardapio_titulo').has('span').each((i, el) => {
    const title = cheerio(el).children('b').text();
    const content = cheerio(el).children('span').text();

    console.log(title, content);

    if (content.indexOf('Não Definido') === -1) {
      if (content.indexOf('/')) {
        const contentArray = content.split('/');
        for (let k = 0; k < contentArray.length; k += 1) {
          menuContents.push({title, content: contentArray[k]});
        }
      } else {
        menuContents.push({title, content});
      }
    } else {
      undefinedCounter += 1;
    }
  });

  if (undefinedCounter > 3) return {title: '', content: 'Desculpa, cardápio não definido 😓'};
  return menuContents;
}

/**
 * Retorna o conteúdo do cardápio
 * @param  {string} lunchOrDinner 'lunch' para almoço, 'dinner' para janta
 * @return {Promise<Array<{title: string, content:string}>>}  Promessa que retorna os conteúdos do cardápio
 */
function getMenu(lunchOrDinner) {
  return request('http://www2.ufscar.br/restaurantes-universitario').then((body) => {
    const $ = cheerio.load(body);

    const cardapioDiv = $('#cardapio').children();
    let mealDiv;

    if (lunchOrDinner === 'lunch') {
      mealDiv = cardapioDiv.first().find('div');
    } else if (lunchOrDinner === 'dinner') {
      mealDiv = cardapioDiv.last().find('div');
    } else {
      throw new Error('lunchOrDinner must be \'lunch\' or \'dinner\'');
    }

    const menuContents = getMenuContents(mealDiv);

    // TODO: Adicionar personalidade, emojis, avisos para comidas especificas

    return menuContents;
  });
}

/**
 * Preenche automaticamente o tipo do cardápio em getMenu
 * @return {Promise<Array<{title: string, content:string}>>} [description]
 */
function getNextMenu() {
  const currentTime = new Date().getHours();
  if (currentTime < 14) {
    return getMenu('lunch');
  }
  return getMenu('dinner');
}

/**
 * Formata o conteúdo do cardápio como listas para o facebook
 * @return {Promise<Array>} Promise que resolve um array de listas
 */
function ufscarMenu() {
  return getNextMenu().then((menuContents) => {
    const promises = [];
    const attachments = [];
    for (let i = 0; i < menuContents.length; i += 1) {
      promises.push(getGoogleImage(menuContents[i].content).then((imageURL) => ({
        title: menuContents[i].title,
        subtitle: menuContents[i].content,
        image_url: imageURL,
      })));
    }

    return Promise.all(promises).then((elements) => {
      do {
        const newAttachment = {
          type: 'template',
          payload: {
            template_type: 'list',
            elements: [],
          },
        };
        newAttachment.payload.elements = elements.splice(0, 4);
        attachments.push(newAttachment);
      } while (elements.length > 4);
      return attachments;
    });
  });
}


module.exports = {getNextMenu, ufscarMenu};
