/*
This file converts the raw data into a .sql dump to be imported into MySql. It's no longer needed
*/

// settings:
const dataInput = '../raw-data/'; // takes a folder
const fileOutput = '../db.sql'; //takes a file name
const tableName = 'name_by_year'; // what you call your table

const fs = require('fs');
var db = {}; // this'll be where all the data are stored before seeding to sequelizeModel
var namesTally = 0; // for terminal output purposes, unimportant.
var primaryKey = 1; // starting point of primary key in the table

console.time('Time taken to read all data'); //start a timer to read all data
  readData(); //read all raw txt files into memory as an object
console.timeEnd('Time taken to read all data'); //timer ends, log out the time taken

console.time('Time taken to manipulate data'); //start a timer to reform data
  console.log('Start processing data...');
  reformData(); //decorate the data a little bit
  sex(); //set whether a name is unisex
  sort(); //re-order the data so that similar names will appear from common to uncommon
  findSimilar(); // find similar names
console.timeEnd('Time taken to manipulate data'); //timer ends, log out the time taken

console.time('Time taken to output to .sql file'); //start a timer output to .sql file
  writeToSql(); //output to a .sql file
console.timeEnd('Time taken to output to .sql file'); //timer ends, log out the time taken


function readData() { // this function reads raw data from txt files, and put all the data into the db object.
  var fileList = fs.readdirSync(dataInput); // read all files in the folder
  fileList = fileList.filter(fileName => fileName.includes('yob')); // exclude files that aren't data
  var totalYears = fileList.length;
  console.log(`\n${totalYears} files found...\nstart reading files...`);
  years = []; // a global variable to store all the year names provided by dataInput

  for (let i of fileList) {
    let year = i.slice(3, 7);
    years.push(year); // store the year name for later use (when writing to .sql file)
    let thisYearsContent = fs.readFileSync(dataInput + i, 'UTF-8'); //async was tried, but not faster. Maybe the file reading is single threaded, at least in Windows.
    processThisYear(year, thisYearsContent);
  }
  var totalNames = Object.keys(db).length;
  console.log(`\nOn average, ${Math.round(namesTally / totalYears)} names were used each year, and ${totalNames} name were ever used over the ${totalYears} years.\n`);
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
  if (!db[key]) db[key] = {}; // if this name hasn't appeared yet, create it
  db[key][year] = Number(population);
}

function reformData() { //this function adds a few properties to every name
  for (let nameGender in db) {
    //first, if a name was used by less than 500 people ever, delete it:
    let arrayOfKeys = Object.keys(db[nameGender]); // an array of years chronologically
    let arrayOfValues = Object.values(db[nameGender]); //an array of population of each year chronologically, will use many times
    let sum = arrayOfValues.reduce((accumulator, i) => accumulator + i); //calculate the sum of this name of all time
    if (sum < 500) {
      delete db[nameGender];
      continue;
    }
    db[nameGender].sum = sum;
    //calculate which year had the max population:
    let max = Math.max(...arrayOfValues); // this is the max population among all the years
    db[nameGender].max = max; // attach it to the object
    maxYear = arrayOfKeys[arrayOfValues.indexOf(max)]; // this is the year where max population occurred
    //determine if this name had a peak, if max > avg * 5, then yes:
    let avg = sum / arrayOfKeys.length;
    let peak_year = (max > avg * 5) ? maxYear : 0; // if this name didn't have a peak, use 0. I want this column to be integer, so can't use null
    db[nameGender].peak_year = peak_year; // attach it to the object
    // attach name and gender to properties for later use
    db[nameGender].name = nameGender.slice(0, -2);
    db[nameGender].gender = nameGender.slice(-1);
    // attach a short version of this name for later use:
    db[nameGender].short = truncate(db[nameGender].name);
  }
}

function sex() { //this function decides if a name is predominantly a female or male or unisex name, saves the result in .domGender
  // for most names, the following code will be executed twice, which is redundant, but it's the clearest logic to write, and it's not so slow
  for (let i in db) {
    let keyM = db[i].name + ';M';
    let keyF = db[i].name + ';F';
    if (!db[keyM]) { // if M doesn't exist, the current's domGender is F
      db[i].domGender = 'F';
      continue;
    }
    if (!db[keyF]) { // and vice versa
      db[i].domGender = 'M';
      continue;
    }
    let sumF = db[keyF].sum;
    let sumM = db[keyM].sum;
    if (sumF < sumM * 5 && sumF > sumM / 5) { //if the female counterpart is in the range of male / 5 and male * 5, then it's unisex
      db[keyF].domGender = db[keyM].domGender = 'U';
      continue;
    }
    if (sumM > sumF) {
      db[keyF].domGender = db[keyM].domGender = 'M';
    } else {
      db[keyF].domGender = db[keyM].domGender = 'F';
    }
  }
}

function sort() { // this function sort the dataStorge by sum descending, so that similar names with be ranked by sum too
  var keys = Object.keys(db);
  keys.sort((a, b) => db[b].sum - db[a].sum);
  var newStorage = {};
  for (let i of keys) {
    newStorage[i] = db[i];
  }
  db = newStorage;
}

function findSimilar() { // this function finds all similar names of each name, store them in .similar
  for (let i in db) {
    db[i].similar = [];
    for (let j in db) {
      if (db[j].sum < 1000) break; // no need for uncommon variations
      if (db[j].name.length == 2) continue; // I don't need 2 letter names in the variations
      if (db[j].short.startsWith(db[i].short) || db[i].short.startsWith(db[j].short)) {
        db[i].similar.push(db[j].name + db[j].gender);
        if (db[i].similar.length >= 10) break; // no need for too many since it's ranked by popularity
      }
    }
  }
}
//this function writes into .sql from db:
function writeToSql() {
  var sqlString = `-- when import, select your database first
DROP TABLE IF EXISTS \`${tableName}\`;
CREATE TABLE \`${tableName}\` (
  \`id\` int(7) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(16) NOT NULL,
  \`gender\` char(1) NOT NULL,
  \`domGender\` char(1) NOT NULL,
  \`sum\` int(9) unsigned NOT NULL,
  \`peak_year\` int(4) unsigned NOT NULL,
  \`similar\` varchar(255) NOT NULL,`;

  for (let i of years) {
    sqlString += `\n  \`${i}\` int(7) unsigned NOT NULL,`;
  }

  sqlString += `
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`id_UNIQUE\` (\`id\`)
);
`;

  for (let nameGender in db) {
    let line = `(${(primaryKey++)},'${nameGender.split(';').join("','")}','${db[nameGender].domGender}',${db[nameGender].sum},${db[nameGender].peak_year},'${db[nameGender].similar.join(',')}',`; // start constructing a line in csv
    for (let year of years) {
      if (db[nameGender][year]) {
        line += db[nameGender][year] + ',';
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
  setTimeout(() => { // set time out so it logs after the console.time
    console.log(`\nOutput to ${fileOutput} successful.`);
  }, 0);
}

function truncate(name) { // this function takes a name and return its truncated version
  name = name.split('');
  // the following don't include the initial, since it's capital
  name = name.map(i => i == 'v' ? 'f' : i); // replace all letter v with letter f
  name = name.map(i => i == 'y' ? 'i' : i); // replace all letter y with letter i
  name = name.map(i => i == 'z' ? 's' : i); // replace all letter y with letter i
  name = prune(name); // turn double letters into single except ee and oo, change ph to f, ck to k
  name = removeVowel(name);
  name[0] = name[0].toUpperCase();
  return name.join('');
}

function prune(name) { // takes an array, removes double letters, for instance aaron => aron, except ee and oo, and also turns ph into f, ck into k
  for (var i = 1; i < name.length; i++) {
    if (name[i] == 'e' || name[i] == 'o') continue; // don't remove ee or oo
    if (name[i] == name[i - 1]) name[i - 1] = '#';
    if (name[i] == 'h' && name[i - 1] == 'p') {
      name[i - 1] = '#';
      name[i] = 'f';
    }
    if (name[i] == 'c' && !'ehi'.includes(name[i + 1])) { // other than ce, ch, ci, turn all c into k
      name[i] = 'k';
    }
  }
  return name.filter(i => i != '#'); // filter out all #s
}

function removeVowel(name) { // takes an array, remove vowels from end while length longer than 3
  while (['a', 'e', 'i', 'o', 'u'].includes(name[name.length - 1]) && name.length > 3) {
    name.pop();
  }
  return name;
}
