// settings: where's the data coming from, which table is it going to
const dataInput = './raw-data/full-data/'; // takes a folder
const fileOutput = './full-data.csv'; //takes a file name
const yearRange = [1880, 2016] // what year's data did your provide? This should correspond with the value of dataInput
const fs = require('fs');
var dataStorage = {}; // this'll be where all the data are stored before seeding to sequelizeModel
var namesTally = 0; // This is for terminal output purposes, unimportant.
var primaryKey = 1;
readData(); //read raw txt files
writeToCSV();
//this function writes into csv from dataStorage
function writeToCSV() {
  console.time('Time taken to reform data to csv'); //start a timer

  var csvString = '';
  csvString += `"id";"name";"gender";` //first line
  for (let i = yearRange[0]; i <= yearRange[1]; i++) { //column names of first line
    csvString += `"${i}";`
  }
  csvString = csvString.slice(0, -1); //remove the last semicolon
  csvString += `\n`;
  for (let nameGender in dataStorage) {
    let line = `${(primaryKey++)};${nameGender};`; // start constructing a line in csv
    for (let year = yearRange[0]; year <= yearRange[1]; year++) {
      if (dataStorage[nameGender][year]) {
        line += dataStorage[nameGender][year] + ';';
      } else {
        line += '0;';
      }
    }
    line = line.slice(0, -1); //remove the last semicolon of each line end
    csvString+=`${line}\n`;
  }
  console.timeEnd('Time taken to reform data to csv'); //timer ends, log out the time taken
  console.time('Time taken to output to csv file'); //start a timer output to csv file
  fs.writeFileSync(fileOutput, csvString);
  console.timeEnd('Time taken to output to csv file'); //timer ends, log out the time taken
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
  var key = name + ';' + gender;
  if (!dataStorage[key]) dataStorage[key] = {}; // if this name hasn't appeared yet, create it
  dataStorage[key][year] = Number(population);
}
