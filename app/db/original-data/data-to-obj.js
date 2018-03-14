const fs = require('fs');
var fileList = fs.readdirSync('./mock2012-2016/');
var database = {}; // this'll be where all the data are stored
for (let i of fileList) {
  let year = i.slice(3, 7);
  let thisYearsContent = fs.readFileSync('./mock2012-2016/' + i, 'UTF-8');
  processThisYear(year, thisYearsContent);
}

function processThisYear(year, thisYearsContent) {
  var lines = thisYearsContent.split('\n');
  lines.pop(); // remove the last item, because the last line is always an empty line.
  for (let i of lines) {
    processThisLine(year, ...i.split(','));
  }
}

function processThisLine(year, name, gender, population) {
  if (!database[name]) database[name] = {}; // if this name hasn't appeared yet, create it
  database[name].gender = gender;
  database[name][year] = population;
}

console.log('database: ', JSON.stringify(database, null, 1));

