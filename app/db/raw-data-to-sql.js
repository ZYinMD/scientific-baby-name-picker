/*
This file converts the raw data into a .sql dump to be imported into MySql
*/

// settings:
const dataInput = './raw-data/'; // takes a folder
const fileOutput = './name_by_year.sql'; //takes a file name
const dbName = 'baby_name_picker'; // what do you call your database
const tableName = 'name_by_year'; // what do you call your table

const fs = require('fs');
var dataStorage = {}; // this'll be where all the data are stored before seeding to sequelizeModel
var namesTally = 0; // for terminal output purposes, unimportant.
var primaryKey = 1; // starting point of primary key in the table

console.time('Time taken to read all data'); //start a timer to read all data
  readData(); //read all raw txt files into memory as an object
console.timeEnd('Time taken to read all data'); //timer ends, log out the time taken

console.time('Time taken to manipulate data'); //start a timer to reform data
  reformData(); //decorate the data a little bit
  isUnisex(); //set whether a name is unisex
console.timeEnd('Time taken to manipulate data'); //timer ends, log out the time taken

console.time('Time taken to output to .sql file'); //start a timer output to .sql file
  writeToSql(); //output to a .sql file
console.timeEnd('Time taken to output to .sql file'); //timer ends, log out the time taken


function readData() { // this function reads raw data from txt files, and put all the data into the dataStorage object.
  var fileList = fs.readdirSync(dataInput); //read all files in the folder
  var totalYears = fileList.length;
  console.log(`\n${totalYears} files found...\nstart reading files...`);
  years = []; // a global variable to store all the year names provided by dataInput

  for (let i of fileList) {
    let year = i.slice(3, 7);
    years.push(year); // store the year name for later use (when writing to .sql file)
    let thisYearsContent = fs.readFileSync(dataInput + i, 'UTF-8'); //async was tried, but not faster. Maybe the file reading is single threaded, at least in Windows.
    processThisYear(year, thisYearsContent);
  }
  var totalNames = Object.keys(dataStorage).length;
  console.log(`\nOn average, ${Math.round(namesTally / totalYears)} names were used each year, while ${totalNames} name were ever used over the ${totalYears} years.\n`);
}

function processThisYear(year, thisYearsContent) { // this function processes a txt file
  var lines = thisYearsContent.split('\n');
  lines.pop(); // remove the last item, because the last line is always an empty line.
  namesTally += lines.length;
  for (let i of lines) {
    processThisLine(year, ...i.split(','));
  }
}

function processThisLine(year, name, gender, population) { // this function processes a line in a txt file
  var key = name + ';' + gender;
  if (!dataStorage[key]) dataStorage[key] = {}; // if this name hasn't appeared yet, create it
  dataStorage[key][year] = Number(population);
}

function reformData() { //this function adds a few properties to every name
  for (let nameGender in dataStorage) {
    //first, if a name was used by less than 500 people ever, delete it:
    let arrayOfKeys = Object.keys(dataStorage[nameGender]); // an array of years chronologically
    let arrayOfValues = Object.values(dataStorage[nameGender]); //an array of population of each year chronologically, will use many times
    let sum = arrayOfValues.reduce((accumulator, i) => accumulator + i); //calculate the sum of this name of all time
    if (sum < 500) {
      delete dataStorage[nameGender];
      continue;
    }
    dataStorage[nameGender].sum = sum;
    //calculate which year had the max population:
    let max = Math.max(...arrayOfValues); // this is the max population among all the years
    dataStorage[nameGender].max = max; // attach it to the object
    maxYear = arrayOfKeys[arrayOfValues.indexOf(max)]; // this is the year where max population occurred
    //determine if this name had a peak, if max > avg * 5, then yes:
    let avg = sum / arrayOfKeys.length;
    let peak_year = (max > avg * 5) ? maxYear : 0; // if this name didn't have a peak, use 0. I want this column to be integer, so can't use null
    dataStorage[nameGender].peak_year = peak_year; // attach it to the object
  }
}

function isUnisex() { //this function determines if a name is unisex
  for (let nameGender in dataStorage) {
    //determine if this name is a unisex name:
    dataStorage[nameGender].is_unisex = 0; //first all names to be not unisex
    let gender = nameGender.slice(-1);
    if (gender == 'M') { // if current iteration is a male name
      let femaleName = nameGender.slice(0, -2) + ';F';
      if (dataStorage[femaleName]) { //if the female counterpart exists
        let femaleSum = dataStorage[femaleName].sum;
        let maleSum = dataStorage[nameGender].sum;
        if (femaleSum < maleSum * 5 && femaleSum > maleSum / 5) { //if the female counterpart is in the range of male / 5 and male * 5, then yes
          dataStorage[nameGender].is_unisex = 1;
          dataStorage[femaleName].is_unisex = 1;
        }
      }
    }
  }
}

//this function writes into .sql from dataStorage:
function writeToSql() {
  var sqlString = `
CREATE DATABASE  IF NOT EXISTS \`${dbName}\`;
USE \`${dbName}\`;
DROP TABLE IF EXISTS \`${tableName}\`;
CREATE TABLE \`${tableName}\` (
  \`id\` int(7) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(16) NOT NULL,
  \`gender\` char(1) NOT NULL,
  \`is_unisex\` tinyint(4) NOT NULL,
  \`sum\` int(9) unsigned NOT NULL,
  \`peak_year\` int(4) unsigned NOT NULL,`;

  for (let i of years) {
    sqlString += `\n  \`${i}\` int(7) unsigned NOT NULL,`;
  }

  sqlString += `
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`id_UNIQUE\` (\`id\`)
);
`;

  for (let nameGender in dataStorage) {
    let line = `(${(primaryKey++)},'${nameGender.split(';').join("','")}',${dataStorage[nameGender].is_unisex},${dataStorage[nameGender].sum},${dataStorage[nameGender].peak_year},`; // start constructing a line in csv
    for (let year of years) {
      if (dataStorage[nameGender][year]) {
        line += dataStorage[nameGender][year] + ',';
      } else {
        line += '0,';
      }
    }
    line = line.slice(0, -1) + '),'; // remove the last comma of each line end, close parenthesis


    // the following is complicated and not mandatory, it inserts 2000 lines at a time, making importing faster. I learned it from the dump
    if (primaryKey % 2000 == 2) {
      sqlString += `INSERT INTO \`${tableName}\` VALUES `;
    }
    sqlString += line;
    if (primaryKey % 2000 == 1) {
      sqlString = sqlString.slice(0, -1) + ';\n';
    }
  }

  sqlString = sqlString.slice(0, -1) + ';\n';

  fs.writeFileSync(fileOutput, sqlString);
  setTimeout(() => {
    console.log(`\nOutput to ${fileOutput} successful.`);
  }, 0);
}
