/*
This file is no longer needed. Originally it was used to process the raw data from SSA, and export as CSV for MySql Workbench to import.
Since the data is very big, seeding the table with npm sequelize and npm mysql both timed out and failed.
.csv is much slower than .sql to import, but it's too hard to manually construct .sql
*/

// settings: where's the data coming from, which table is it going to
const dataInput = './raw-data/full-data/'; // takes a folder
const fileOutput = './name_by_year.csv'; //takes a file name
const yearRange = [1880, 2016] // what year's data did your provide? This should correspond with the value of dataInput

const fs = require('fs');
var dataStorage = {}; // this'll be where all the data are stored before seeding to sequelizeModel
var namesTally = 0; // This is for terminal output purposes, unimportant.
var primaryKey = 1;

console.time('Time taken to read all data'); //start a timer to read all data
  readData(); //read all raw txt files into memory as an object
console.timeEnd('Time taken to read all data'); //timer ends, log out the time taken

console.time('Time taken to manipulate data'); //start a timer to reform data
  reformData(); //decorate the data a little bit
  isUnisex(); //set whether a name is unisex
console.timeEnd('Time taken to manipulate data'); //timer ends, log out the time taken

console.time('Time taken to output to csv file'); //start a timer output to csv file
  writeToCSV(); //output to a csv file
console.timeEnd('Time taken to output to csv file'); //timer ends, log out the time taken


function readData() { // this function reads raw data from txt files, and put all the data into the dataStorage object.
  var fileList = fs.readdirSync(dataInput); //read all files in the folder
  var totalYears = fileList.length;
  console.log(`\n${totalYears} files found...\nstart reading files...`);
  for (let i of fileList) {
    let year = i.slice(3, 7);
    let thisYearsContent = fs.readFileSync(dataInput + i, 'UTF-8'); //async was tried, but not faster. Maybe the file reading is single threaded, at least in Windows.
    processThisYear(year, thisYearsContent);
  }
  var totalNames = Object.keys(dataStorage).length;
  console.log(`On average, ${Math.round(namesTally / totalYears)} names were used each year, while ${totalNames} name were ever used over the ${totalYears} years\n`);
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
    let arrayOfKeys = Object.keys(dataStorage[nameGender]) // an array of years chronologically
    let arrayOfValues = Object.values(dataStorage[nameGender]) //an array of population of each year chronologically, will use many times
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
    let peak_year = (max > avg * 5) ? maxYear : 0; // if this name didn't have a peak, use 0. I want this column to be integer, so can't use null, at least not in csv
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
        let femaleSum = dataStorage[femaleName].sum
        let maleSum = dataStorage[nameGender].sum
        if (femaleSum < maleSum * 5 && femaleSum > maleSum / 5) { //if the female counterpart is in the range of male / 5 and male * 5, then yes
          dataStorage[nameGender].is_unisex = 1;
          dataStorage[femaleName].is_unisex = 1;
        }
      }
    }
  }
}
//this function writes into csv from dataStorage:
function writeToCSV() {
  var csvString = '';
  //first construct line 1, which is the schema:
  csvString += `"id";"name";"gender";"is_unisex";"sum";"peak_year";`
  for (let i = yearRange[0]; i <= yearRange[1]; i++) { //years (columns) of first line
    csvString += `"${i}";`
  }
  csvString = csvString.slice(0, -1); //remove the last semicolon after the last year
  csvString += `\n`;
  //then construct the rows:
  for (let nameGender in dataStorage) {
    let line = `${(primaryKey++)};${nameGender};${dataStorage[nameGender].is_unisex};${dataStorage[nameGender].sum};${dataStorage[nameGender].peak_year};`; // start constructing a line in csv
    for (let year = yearRange[0]; year <= yearRange[1]; year++) {
      if (dataStorage[nameGender][year]) {
        line += dataStorage[nameGender][year] + ';';
      } else {
        line += '0;';
      }
    }
    line = line.slice(0, -1); //remove the last semicolon of each line end
    csvString += `${line}\n`;
  }
  fs.writeFileSync(fileOutput, csvString);
}

