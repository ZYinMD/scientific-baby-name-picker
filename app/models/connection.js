const Sequelize = require("sequelize");
const enviroment = process.env.NODE_ENV || 'development';
var config = require('../config/config.json')[enviroment];
require('dotenv').config();
console.log(process.env.LOCALHOST_MYSQL_SERVER_ROOT_PASSWORD);

