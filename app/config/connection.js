//this file establishes connection to database

const Sequelize = require("sequelize");
const enviroment = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[enviroment];
const sequelize = new Sequelize(config.database, config.username, config.password, config.settings);
module.exports = sequelize;
