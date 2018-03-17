/*
Please ignore this file
This file was originally written to test if reading all the raw data asynchronously was faster than synchronously.
The result is it's not. My guess is the file reading was single-threaded. At least in Windows.
I stopped updating this file since this file basically did the same thing as its counterpart, and the 100+ promises were iffy.
What you see is some old functionalities.
*/
const dataInput = './raw-data/mock2012-2016/'; // takes a folder
const dataOutput = './mock-data.json'; // output to a json file
const fs = require('fs');
var dataStorage = {}; // this'll be where all the data are stored
var [namesTally, totalYears] = [0, 0];
console.time('Time taken to read all data');
var fileList = fs.readdirSync(dataInput);
totalYears = fileList.length;
console.log(`\n${totalYears} files found...\nstart reading files...`);
var promiseList = [];
for (let i of fileList) {
  let contentOfThisFile = new Promise((resolve, reject) => {
    fs.readFile(dataInput + i, 'UTF-8', (err, res) => {
      let year = i.slice(3, 7);
      if (err) reject(err);
      else {
        processThisYear(res, year);
        resolve('this file done');
      }
    });
  });
  promiseList.push(contentOfThisFile);
}
Promise.all(promiseList).then(() => {
  var totalNames = Object.keys(dataStorage).length;
  console.log(`On average, ${Math.round(namesTally / totalYears)} names were used each year, while ${totalNames} name were ever used over the ${totalYears} years`);
  console.timeEnd('Time taken to read all data'); //timer ends, log out the time taken
  console.time('Time taken to output to file'); //start a timer
  console.log(dataStorage);
  fs.writeFileSync(dataOutput, JSON.stringify(dataStorage, null, 2));
  console.timeEnd('Time taken to output to file'); //timer ends, log out the time taken
}).catch((err) => {
  console.log('something went wrong: ', err);
});

function processThisYear(thisYearsContent, year) {
  var lines = thisYearsContent.split('\n');
  lines.pop(); // remove the last item, because the last line is always an empty line.
  namesTally += lines.length;
  for (let i of lines) {
    processThisLine(year, ...i.split(','));
  }
}

function processThisLine(year, name, gender, population) {

  var key = name + ', ' + gender;
  if (!dataStorage[key]) dataStorage[key] = {}; // if this name hasn't appeared yet, create it
  dataStorage[key][year] = Number(population);
}
