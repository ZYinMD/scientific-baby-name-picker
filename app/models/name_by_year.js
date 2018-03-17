//this file creates and syncs to the big table
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
const NameByYear = sequelize.define('name_by_year', columns, {timestamps: false});
NameByYear.sync();
module.exports = NameByYear;
