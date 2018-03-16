const Sequelize = require("sequelize");
const enviroment = process.env.NODE_ENV || 'development';
var config = require('../config/config.js')[enviroment];
console.log(config);
require('dotenv').config();
console.log(process.env.LOCALHOST_MYSQL_SERVER_ROOT_PASSWORD);

