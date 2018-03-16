module.exports = {
  development: {
    database: 'baby_name_picker',
    username: 'root',
    // If you need to set your localhost mysql server password, either change the null part, or create your own .env file.
    password: process.env.LOCALHOST_MYSQL_SERVER_ROOT_PASSWORD||null,
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
