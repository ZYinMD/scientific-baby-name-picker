const db = require('../config/connection.js');
module.exports = function(app) {
  app.get('/api', (req, res) => {
    var query = req.query.query; //req.query is the data user sent in $.get(url, callback, data). It can be a object or string.
    console.log(query);
    db.query(query, (error, results, fields) => {
      if (error) throw error;
      //manually re-construct the results so data transfer is minimized
      var names = [];
      for (let i of results[0]) {
        names.push(i.name + i.gender);
      }
      var countNoLimit = results[1][0]['FOUND_ROWS()'];
      res.json([names, countNoLimit]); //return two things, all the names and gender, and the total sql results if it had no LIMIT
    });
  });
  app.get('/api/name', (req, res) => {
    console.log('req.query: ', req.query);
    var query = `SELECT * FROM name_by_year WHERE name = '${req.query.name}' AND gender = '${req.query.gender}'`;
    db.query(query, (error, result, fields) => {
      if (error) throw error;
      res.json(result[0]);
    });
  });
};
