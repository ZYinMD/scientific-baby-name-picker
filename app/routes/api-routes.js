var data = require('../db/test.json'); //get data out of the json file as database
module.exports = function(app) {
  app.get('/api/test', (req, res) => res.json(data));
};
