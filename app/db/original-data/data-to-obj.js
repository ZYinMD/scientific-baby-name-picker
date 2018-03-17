const dataInput = './full-data/'; // a folder name
const dataOutput = '../full-data.json'; // a file
const fs = require('fs');
var database = {}; // this'll be where all the data are stored
var [namesTally, totalYears] = [0, 0];
console.time('Time taken to read all data');
var fileList = fs.readdirSync(dataInput);
totalYears = fileList.length;
console.log(`\n${totalYears} files found...\nstart reading files...`);
for (let i of fileList) {
  let year = i.slice(3, 7);
  let thisYearsContent = fs.readFileSync(dataInput + i, 'UTF-8');
  processThisYear(year, thisYearsContent);
}
var totalNames = Object.keys(database).length;
console.log(`On average, ${Math.round(namesTally / totalYears)} names were used each year, while ${totalNames} name were ever used over the ${totalYears} years`);
console.timeEnd('Time taken to read all data'); //timer ends, log out the time taken
console.time('Time taken to output to file'); //start a timer
fs.writeFileSync(dataOutput, JSON.stringify(database, null, 1)); //final output
console.timeEnd('Time taken to output to file'); //timer ends, log out the time taken

function processThisYear(year, thisYearsContent) {
  var lines = thisYearsContent.split('\n');
  lines.pop(); // remove the last item, because the last line is always an empty line.
  namesTally += lines.length;
  for (let i of lines) {
    processThisLine(year, ...i.split(','));
  }
}

function processThisLine(year, name, gender, population) {
  var key = name + ', ' + gender;
  if (!database[key]) database[key] = {}; // if this name hasn't appeared yet, create it
  database[key][year] = Number(population);
}
