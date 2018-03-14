const dataInput = './mock2012-2016/'; // a folder name
const dataOutput = '../mockdata.json'; // a file
const fs = require('fs');
var database = {}; // this'll be where all the data are stored

fs.readdir(dataInput, (err, fileList) => {
  if (err) throw err;
  for (let i of fileList) {
    let year = i.slice(3, 7);
    let thisYearsContent = fs.readFileSync('./mock2012-2016/' + i, 'UTF-8');
    processThisYear(year, thisYearsContent);
  }
  fs.writeFileSync(dataOutput, JSON.stringify(database, null, 1)); //final output
});

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
  database[name][year] = Number(population);
}


