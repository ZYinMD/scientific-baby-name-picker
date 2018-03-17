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
for (let i = 2012; i < 2017; i++) {
  columns[String(i)] = Sequelize.MEDIUMINT;
}
const MockTable = sequelize.define('mock_table', columns, {timestamps: false, logging: true, benchmark: true});
MockTable.sync({force: false});
module.exports = MockTable;
