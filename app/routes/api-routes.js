const db = require('../config/connection.js')
module.exports = function(app) {
  app.get('/api', (req, res) => {
    var query = req.query.query; //req.query is the data user sent in $.get(url, callback, data). It can be a object or string.
    console.log(query);
    db.query(query, (error, results, fields) => {
      if (error) throw error;
      res.json(results);
    });
  });
};
