const { compose } = require('./compose');

compose('Buncombe', 'home', (content) => {
  console.log('content : ', content);
});
