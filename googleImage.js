const request = require('request-promise');

/**
 * Retorna a primeira imagem encontrada no Google Imagens
 * @param  {string} query Texto a ser pesquisado
 * @return {Promise<string>}       URL da imagem encontrada
 */
function getGoogleImage(query) {
  const requestOptions = {
    uri: 'https://www.googleapis.com/customsearch/v1',
    qs: {
      q: query,
      gl: 'br',
      num: 1,
      safe: 'high',
      searchType: 'image',
      cx: process.env.GOOGLECX,
      key: process.env.GOOGLEAPIKEY,
    },
  };

  return request(requestOptions).then((json) => {
    const res = JSON.parse(json);
    return res.items[0].link;
  });
}

module.exports = getGoogleImage;
