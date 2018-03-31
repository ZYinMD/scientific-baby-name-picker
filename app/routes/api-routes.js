const db = require('../config/connection.js');
const newbornByYear = require('./newborn-by-year.js');
module.exports = function(app) {
  app.get('/api', returnFilterResults);
  app.get('/api/name', returnNameInfo);
  app.get('/api/newbornByYear', (req, res) => {
    res.json(newbornByYear);
  });
};

function returnFilterResults(req, res) { //this function processes the req and res of an http GET
  var queries = []; // this holds all filters, each filter is a WHERE clause
  for (let i of req.query.conditions) {
    i.startYear = Number(i.startYear) || null;
    i.endYear = Number(i.endYear) || null;
    i.howMany = Number(i.howMany) || null;
    queries.push(conditionToSql(i));
  }
  var finalQuery = queries.join(') AND (');
  finalQuery =
    `SELECT SQL_CALC_FOUND_ROWS name, gender FROM name_by_year
WHERE (${finalQuery})
ORDER BY sum DESC LIMIT 1000;
SELECT FOUND_ROWS();`;
  console.log('finalQuery: ', finalQuery);
  /*if (req.query.pool) {}*/
  queryDB(finalQuery).then( // use the query string to query the MySql database
    results => {
      //manually re-construct the results so data transfer is minimized
      var names = [];
      for (let i of results[0]) {
        names.push(i.name + i.gender);
      }
      var countNoLimit = results[1][0]['FOUND_ROWS()']; // this is how many results it would have returned without limit
      res.json([names, countNoLimit]); //return two things, all the names and gender, and the total sql results if it had no LIMIT
    }
  ).catch(error => {
    throw error;
  });
}

function conditionToSql(conditions) {
  var query = '';
  switch (conditions.a) {
    case 'gender':
      var gendersChecked = conditions.gendersChecked.map(g => {
        if (g == 'F') return "gender = 'F'";
        if (g == 'M') return "gender = 'M'";
        if (g == 'U') return "is_unisex = 1";
      });
      // I am so smart:
      query = conditions.b == 'exclude' ?
        gendersChecked.join(' OR ') :
        gendersChecked.join(' AND ');
      break;
    case 'total':
      // e.g. WHERE `1991` + `1992` + `1993` < 2000
      query = `${yearRangeToSql(conditions.startYear, conditions.endYear)} ${conditions.operator} ${conditions.howMany}`;
      break;
    case 'common':
      // e.g. WHERE (`1991` + `1992` + `1993`) / (SUM(`1991`) + SUM(`1992`) + SUM(`1993`)) * 750 < 3;
      query = `${yearRangeToSql(conditions.startYear, conditions.endYear)} / ${newBornBetween(conditions.startYear, conditions.endYear)} * 750 ${conditions.operator} ${conditions.howMany}`;
      break;
    case 'peak':
      // e.g. WHERE peak_year BETWEEN 1950 AND 1970
      query = `peak_year BETWEEN ${conditions.startYear} AND ${conditions.endYear}`;
      break;
    case 'trending':
      // e.g. WHERE  (`2014`>`2013` * 1.05 AND `2015`>`2014` * 1.05 AND `2016`>`2015` * 1.05)
      query = trendingToSql(conditions.startYear, conditions.endYear, conditions.trend, conditions.percent);
      break;
    default:
      console.log('something went wrong');
  }
  if (conditions.b == 'exclude') query = `!(${query})`; // if exclude, reverse the query
  return query;
}

function queryDB(query) { // this function queries the MySql db and returns a promise of the results
  return new Promise((resolve, reject) => {
    db.query(query, (error, results, fields) => {
      if (error) reject(error);
      resolve(results);
    });
  });
}

function returnNameInfo(req, res) { // this function queries the MySql db for a single name and returns all its fields
  var query = req.query.gender ?
    `SELECT * FROM name_by_year WHERE name = '${req.query.name}' AND gender = '${req.query.gender}'` :
    `SELECT * FROM name_by_year WHERE name = '${req.query.name}' ORDER BY sum DESC LIMIT 1`;
  //use npm mysql to escape in this function, no manual validation
    console.log('query: ', query);

  db.query(query, (error, result, fields) => {
    if (error) throw error;
    if (!result[0]) {
      res.json({name: 'Name not found'});
      return;
    }
    console.log('result: ', result);
    console.log('result[0]: ', result[0]);
    console.log('query: ', query);
    res.json(result[0]);
  });
}

function yearRangeToSql(startYear, endYear) { // this function turns a year range into a string ready for sql
  var res = '';
  for (var i = startYear; i <= endYear; i++) {
    res += '`' + i + '` + ';
  }
  res = res.slice(0, -3);
  return `(${res})`;
}

function newBornBetween(startYear, endYear) { // this function calculate how many babies were born in the US between two years
  var result = 0;
  for (var i = startYear; i <= endYear; i++) {
    result += newbornByYear[i];
  }
  return result;
}

function trendingToSql(startYear, endYear, trend, percent) { // this function converts year into sql for trending
  var res = '';
  var portion;
  portion = (trend == 'up') ? 1 + percent / 100 : 1 - percent / 100;
  operator = (trend == 'up') ? '>' : '<';
  for (let i = startYear; i < endYear; i++) {
    res += '`' + (i + 1) + '`' + operator + '`' + i + '` * ' + portion + ' AND ';
  }
  return res.slice(0, -5); //remove the last ' AND '
}
