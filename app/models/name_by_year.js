var Sequelize = require('sequelize');
var sequelize = require('../config/connection.js');
var columns = {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  gender: {
    type: Sequelize.STRING(1),
    allowNull: false
  }
};
for (let i = 1880; i < 2017; i++) {
  columns[String(i)] = Sequelize.MEDIUMINT;
}
var name_by_year = sequelize.define('name_by_year', columns);
name_by_year.sync();
module.exports = name_by_year;
