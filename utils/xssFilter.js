const xss = require('xss'); // 需要 npm install xss

const whiteList = {
  br: [], p: [], strong: [], em: [], u: [], a: ['href', 'title']
};

const filterXSS = (html) => {
  return xss(html, { whiteList });
};

module.exports = { filterXSS };