var data = require('../db/mockdata.json');
module.exports = function(app) {
  app.get('/api/test', (req, res) => res.send(data));
};
