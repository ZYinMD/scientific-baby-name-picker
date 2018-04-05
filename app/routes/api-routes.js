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
  var finalQuery = prepareQuery(req);
  queryDB(finalQuery).then(results => {
    //manually re-construct the results so data transfer is minimized
    var names = [];
    for (let i of results[0]) {
      names.push(i.name + i.gender);
    }
    var countNoLimit = results[1][0]['FOUND_ROWS()']; // this is how many results it would have returned without limit
    res.json([names, countNoLimit]); //return two things, all the names and gender, and the total sql results if it had no LIMIT
  }).catch(error => {
    throw error;
  });
}

function prepareQuery(req) { // this function takes the req from front end, and prepare a query for the db
  var finalFromClause = 'name_by_year';
  if (req.query.fromClauses) { // if there're from clauses, we need subqueries as a table to select from
    req.query.fromClauses.forEach((filter, i) => { // see comments in the bottom of this file
      if (i == 0) finalFromClause = `${fromToSql(filter)}\ntable${i}\n`;
      else finalFromClause += `JOIN\n${fromToSql(filter)}\ntable${i} USING (id)\n`;
    });
    finalFromClause += 'JOIN\nname_by_year USING (id)';
  }
  var whereClauses = []; // this holds all filters (except "by most popular"), each filter is a WHERE clause
  for (let i of req.query.whereClauses) { //req.query is the data object sent by $.ajax() or $.get()
    whereClauses.push(whereToSql(i)); // convert these conditions to MySQL-ready syntax
  }
  var finalWhereClause = whereClauses.join(') AND (');
  // create 2 sql statements, 1st search LIMIT 1000, 2nd show how many results the 1st would have had without LIMIT
  finalQuery =
    `SELECT SQL_CALC_FOUND_ROWS name, gender
FROM ${finalFromClause}
WHERE (${finalWhereClause})
ORDER BY sum DESC LIMIT 1000;
SELECT FOUND_ROWS();`;
  // console.log('finalQuery: \n', finalQuery);
  return finalQuery;
}

function fromToSql(filter) { // this function converts data from front end to MySql subquery that serves as from clause
  filter.startYear = Number(filter.startYear) || null;
  filter.endYear = Number(filter.endYear) || null;
  filter.howMany = Number(filter.howMany) || null;
  switch (filter.b) {
    case 'include':
      return `(SELECT id, ${yearRangeToSql(filter.startYear, filter.endYear)} AS popular_in FROM name_by_year ORDER BY popular_in DESC LIMIT ${filter.howMany})`;
    case 'exclude':
      return `(SELECT id, ${yearRangeToSql(filter.startYear, filter.endYear)} AS popular_in FROM name_by_year ORDER BY popular_in DESC LIMIT ${filter.howMany}, 999999)`;
    default:
      return console.log('something went wrong');
  }
}

function whereToSql(where) { // this function converts data from front end to MySql-ready where clause
  where.startYear = Number(where.startYear) || null;
  where.endYear = Number(where.endYear) || null;
  where.howMany = Number(where.howMany) || null;


  var query = '';
  switch (where.a) {
    case 'gender':
      var gendersChecked = where.gendersChecked.map(g => {
        if (g == 'F') return "gender = 'F'";
        if (g == 'M') return "gender = 'M'";
        if (g == 'U') return "domGender = 'U'";
      });
      // I am so smart:
      query = where.b == 'exclude' ?
        gendersChecked.join(' OR ') :
        gendersChecked.join(' AND ');
      break;
    case 'total':
      // e.g. WHERE `1991` + `1992` + `1993` < 2000
      query = `${yearRangeToSql(where.startYear, where.endYear)} ${where.operator} ${where.howMany}`;
      break;
    case 'peryear':
      // e.g. WHERE (`1991` + `1992` + `1993`) / 3 < 200
      query = `${yearRangeToSql(where.startYear, where.endYear)} / ${where.endYear - where.startYear + 1} ${where.operator} ${where.howMany}`;
      break;
    case 'common':
      // e.g. WHERE (`1991` + `1992` + `1993`) / (SUM(`1991`) + SUM(`1992`) + SUM(`1993`)) * 750 < 3;
      query = `${yearRangeToSql(where.startYear, where.endYear)} / ${newBornBetween(where.startYear, where.endYear)} * 750 ${where.operator} ${where.howMany}`;
      break;
    case 'peak':
      // e.g. WHERE peak_year BETWEEN 1950 AND 1970
      query = `peak_year BETWEEN ${where.startYear} AND ${where.endYear}`;
      break;
    case 'trending':
      // e.g. WHERE  (`2014`>`2013` * 1.05 AND `2015`>`2014` * 1.05 AND `2016`>`2015` * 1.05)
      query = trendingToSql(where.startYear, where.endYear, where.trend, where.percent);
      break;
    default:
      console.log('something went wrong');
  }
  if (where.b == 'exclude') query = `!(${query})`; // if exclude, reverse the query
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
  db.query(query, (error, result, fields) => {
    if (error) throw error;
    if (!result[0]) {
      res.json({
        name: 'Name not found'
      });
      return;
    }
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


/*
This is what the finalQuery looks like when there're a bunch of "filter by most popular" filters:

SELECT name, id FROM

  (SELECT id, `1950` + `1951` + `1952` + `1953` AS popular_in FROM name_by_year ORDER BY popular_in DESC LIMIT 100)
  table1

  JOIN
  (SELECT id, `1966` + `1967` + `1968` + `1969` AS popular_in FROM name_by_year ORDER BY popular_in DESC LIMIT 50, 99999999)
  table2
  USING (id)

  JOIN
  (SELECT id, `1988` + `1989` + `1990` + `1991` AS popular_in FROM name_by_year ORDER BY popular_in DESC LIMIT 200)
  table3
  USING (id)

  JOIN
  name_by_year USING (id)

WHERE (...)
*/
