// this file contains settings to connect to the database
require('dotenv').config();
module.exports = {
  development: {
    host: 'localhost',
    user: 'root',
    // If you need to set your localhost mysql server password, either change the null part, or create your own .env file.
    // Note: if the dotenv is used, keep in mind it always looks for the .env file in the cwd where you launch node.
    password: process.env.LOCALHOST_MYSQL_SERVER_ROOT_PASSWORD||null,
  },
  production: {
    host: 'example.org',
    user: 'bob',
    password: 'secret'
  }
}
// The code below is no longer used. It was once used for npm sequelize. But I've switched npm mysql instead.
/*
module.exports = {
  development: {
    database: 'baby_name_picker',
    username: 'root',
    // If you need to set your localhost mysql server password, either change the null part, or create your own .env file.
    // Note: if the dotenv is used, keep in mind it always looks for the .env file in the current working directory.
    password: process.env.LOCALHOST_MYSQL_SERVER_ROOT_PASSWORD||null,
    settings: {
      host: 'localhost',
      dialect: 'mysql',
      pool: {
        max: 5,
        min: 0,
        acquire: 3000000,
        idle: 1000000,
        evict: 1000000
      }
    }
  },
  production: {
    database: 'baby_name_picker',
    username: 'root',
    password: null,
    settings: {
      host: 'localhost',
      dialect: 'mysql',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  }
};
*/
