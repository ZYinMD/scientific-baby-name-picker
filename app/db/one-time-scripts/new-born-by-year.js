/*
This file is no longer needed. Originally it was used to to calculate the total population of every year.
It's only needed when the database needs to me minimized by removing rare names.
*/

// settings: where's the data coming from, which table is it going to
const dataInput = '../raw-data/'; // takes a folder
const fileOutput = '../_newborn-by-year.txt'; //takes a file name
const fs = require('fs');
var dataObject = {}; // this is where all data is stored
console.time('Time taken to read all data'); //start a timer to read all data
  readData();
console.timeEnd('Time taken to read all data'); //timer ends, log out the time taken
fs.writeFileSync(fileOutput, JSON.stringify(dataObject, null, 2));


function readData() { // this function reads raw data from txt files
  var fileList = fs.readdirSync(dataInput); //read all files in the folder
  fileList = fileList.filter(fileName => fileName.includes('yob')); // exclude files that aren't data
  var totalYears = fileList.length;
  console.log(`\n${totalYears} files found...\nstart reading files...`);
  for (let i of fileList) {
    let year = i.slice(3, 7);
    let thisYearsContent = fs.readFileSync(dataInput + i, 'UTF-8'); //async was tried, but not faster. Maybe the file reading is single threaded, at least in Windows.
    dataObject[year] = processThisYear(thisYearsContent);
  }

}

function processThisYear(thisYearsContent) { // this function processes a txt file
  var lines = thisYearsContent.split('\n');
  lines.pop(); // remove the last item, because the last line is always an empty line.
  var newBornThisYear = 0;
  for (let i of lines) {
    let nameLength = i.indexOf(',');
    let countOfThisName = i.slice(-(i.length - nameLength - 3));
    newBornThisYear += Number(countOfThisName);
  }
  return newBornThisYear;
}


