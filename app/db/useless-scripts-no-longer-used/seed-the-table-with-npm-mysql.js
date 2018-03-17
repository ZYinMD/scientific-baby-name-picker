// settings: where's the data coming from, which table is it going to
const dataInput = './raw-data/mock2012-2016/'; // takes a folder
const tableName = 'mock_tables';
const fs = require('fs');
var dataStorage = {}; // this'll be where all the data are stored before seeding to sequelizeModel
var namesTally = 0; // This is for terminal output purposes, unimportant.
//mysql
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'baby_name_picker'
});
connection.connect();
readData(); //read raw txt files
writeToTable(); //write what's read into the table
connection.end();
//this function writes into the table from dataStorage
function writeToTable() {
  console.log('Start seeding the table...');
  console.time('Time taken to write to table'); //start a timer write to table
  var promiseList = [];
  for (let nameGender in dataStorage) {
    let row = {};
    [row.name, row.gender] = nameGender.split(', ');
    for (let year in dataStorage[nameGender]) {
      row[year] = dataStorage[nameGender][year];
    }
    console.log('---------------------');
    console.log(...Object.keys(row));
    let rowContent = [];
    for (let i in row) {
      rowContent.push(row[i]);
    }
    connection.query('INSERT INTO ?? ? VALUES ?', [tableName, ...Object.keys(row), ...rowContent], function(error, results, fields) {
      // error will be an Error if one occurred during the query
      if (error) throw error;
      // results will contain the results of the query
      // fields will contain information about the returned results fields (if any)
    });
    // promiseList.push(Table.create(row));
  }
  // Promise.all(promiseList)
  //   .then(() => {
  //     console.log(`All ${Object.keys(dataStorage).length} rows successfully inserted!`);
  //     console.timeEnd('Time taken to write to table'); //timer ends, log out the time taken
  //   })
  //   .catch(err => console.log('something went wrong: ', err));
}
// this function reads raw data from txt files, and put all the data into the dataStorage object.
function readData() {
  console.time('Time taken to read all data');
  var fileList = fs.readdirSync(dataInput);
  var totalYears = fileList.length;
  console.log(`\n${totalYears} files found...\nstart reading files...`);
  for (let i of fileList) {
    let year = i.slice(3, 7);
    let thisYearsContent = fs.readFileSync(dataInput + i, 'UTF-8');
    processThisYear(year, thisYearsContent);
  }
  var totalNames = Object.keys(dataStorage).length;
  console.log(`On average, ${Math.round(namesTally / totalYears)} names were used each year, while ${totalNames} name were ever used over the ${totalYears} years`);
  console.timeEnd('Time taken to read all data'); //timer ends, log out the time taken
}
// this function processes a txt file
function processThisYear(year, thisYearsContent) {
  var lines = thisYearsContent.split('\n');
  lines.pop(); // remove the last item, because the last line is always an empty line.
  namesTally += lines.length;
  for (let i of lines) {
    processThisLine(year, ...i.split(','));
  }
}
// this function processes a line in a txt file
function processThisLine(year, name, gender, population) {
  var key = name + ', ' + gender;
  if (!dataStorage[key]) dataStorage[key] = {}; // if this name hasn't appeared yet, create it
  dataStorage[key][year] = Number(population);
}
