//this file establishes connection to the database
const enviroment = process.env.NODE_ENV || 'development';
const mysql = require('mysql');
const config = require('../config/config.js')[enviroment];
var connection = mysql.createConnection(config);
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});
module.exports = connection;

// The code below is no longer used. It was once used for npm sequelize. But I've switched npm mysql instead.
/*
const Sequelize = require("sequelize");
const config = require('../config/config.js')[enviroment];
const sequelize = new Sequelize(config.database, config.username, config.password, config.settings);
module.exports = sequelize;
*/
