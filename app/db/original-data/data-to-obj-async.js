const dataInput = './full-data/'; // a folder name
const dataOutput = '../full-data-async.json'; // a file
const fs = require('fs');
var database = {}; // this'll be where all the data are stored
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
  promiseList.push(contentOfThisFile)
}
Promise.all(promiseList).then(() => {
  var totalNames = Object.keys(database).length;
  console.log(`On average, ${Math.round(namesTally / totalYears)} names were used each year, while ${totalNames} name were ever used over the ${totalYears} years`);
  console.timeEnd('Time taken to read all data'); //timer ends, log out the time taken
  console.time('Time taken to output to file'); //start a timer
  fs.writeFileSync(dataOutput, JSON.stringify(database, null, 1)); //final output
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
  if (!database[key]) database[key] = {}; // if this name hasn't appeared yet, create it
  database[key][year] = Number(population);
}
