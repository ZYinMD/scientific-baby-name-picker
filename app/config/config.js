
var config = {
  development: {
    database: 'baby_name_picker',
    username: 'root',
    password: process.env.LOCALHOST_MYSQL_SERVER_ROOT_PASSWORD||null, // If you need to change your localhost mysql server password, don't change it here, it'll get pushed. Edit the .env in root
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
require('fs').writeFileSync('config.json', JSON.stringify(config, null, 2));
