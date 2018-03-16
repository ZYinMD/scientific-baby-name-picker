// const Sequelize = require("sequelize");
const enviroment = process.env.NODE_ENV || 'development';
// var config = require('/../config/config.json')[env];
require('dotenv').config();
console.log(enviroment);
console.log(process.env.LOCALHOST_MYSQL_SERVER_ROOT_PASSWORD);
