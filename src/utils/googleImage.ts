import * as Promise from 'bluebird';
import * as request from 'request-promise';
import logger from './logger';

/**
 * Retorna a primeira imagem encontrada no Google Imagens
 * @param  {string} query Texto a ser pesquisado
 * @return {Promise<string>}       URL da imagem encontrada
 */
function getGoogleImage(query) {
  const requestOptions = {
    qs: {
      cx: process.env.GOOGLECX,
      gl: 'br',
      key: process.env.GOOGLEAPIKEY,
      num: 1,
      q: query,
      safe: 'high',
      searchType: 'image',
    },
    uri: 'https://www.googleapis.com/customsearch/v1',
  };

  return request(requestOptions).then((json) => {
    logger.debug('Got image from google about ' + query);
    const res = JSON.parse(json);
    return res.items[0].link;
  });
}

export default getGoogleImage;
