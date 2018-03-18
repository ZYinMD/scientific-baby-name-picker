const db = require('../config/connection.js')
module.exports = function(app) {
  app.get('/api', (req, res) => {
    var query = req.query.query; //req.query is the data user sent in $.get(url, callback, data). It can be a object or string.
    // var query = "SELECT name, gender FROM baby_name_picker.name_by_year WHERE `1990` > 1000 AND gender = 'F' ORDER BY `1990` DESC;"
    console.log(query);
    db.query(query, (error, results, fields) => {
      if (error) throw error;
      res.json(results);
    });

  });
  app.post('/api', (req, res) => {
  });
};
