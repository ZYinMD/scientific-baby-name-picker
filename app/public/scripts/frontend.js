var queries = []; //global variable to store all filters for sql
// var elem = document.querySelector('.collapsible');
// var instance = M.Collapsible.init(elem);
filterInit();
materializeInit();
slidersInit();
resultsInit();
// var elem = document.querySelector('.modal');
// var instance = M.Modal.init(elem);
$('.collapsible').collapsible();


$(document).ready(function(){
  $('.modal').modal();
});

function filterInit() { // this function get run on page load
  // filter hide/show:
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__a').on('change', 'input', (event) => { // when any filter is chosen, unhide its row
    unhide(event.target.parentNode.parentNode.classList[1]);
  });
  $('#filter-apply a').on('click', applyFilter);
}

function applyFilter() {
  for (let i = 0; i < 10; i++) { //stupidest thing ever. It can only collapse the current one in the list, but I keep prepending
    $('.collapsible').collapsible('close', i);
  }
  var filter = '';
  var query = '';
  // get over with include / exclude first
  if (whichPicked('b') == 'b-exclude') filter += 'Exclude ';
  else if (whichPicked('b') == 'b-include') filter += 'Include only ';
  else return;
  // get over with year range second
  // year range?
  var startYear = $('#start-year').text();
  var endYear = $('#end-year').text();
  switch (whichPicked('a')) {
    //when "filter by gender" was used
    case 'a-gender':
      let filterArray = [];
      let queryArray = [];
      for (let i of $('.filter-col__c input')) {
        if (i.checked) {
          switch (i.nextElementSibling.innerText) {
            case 'girl names':
              filterArray.push('girl names');
              queryArray.push("gender = 'F'");
              break;
            case 'boy names':
              filterArray.push('boy names');
              queryArray.push("gender = 'M'");
              break;
            case 'unisex names':
              filterArray.push('unisex names');
              queryArray.push("is_unisex = 1");
              break;
            default:
              return;
          }
        }
      }
      filter += filterArray.join(' and ');
      // I am so smart:
      filter.includes('Exclude') ?
        query += queryArray.join(' OR ') :
        query += queryArray.join(' AND ');
      break;
      //when "filter by total birth" was used
    case 'a-total':
      filter += 'names that have been used by';
      // more than or less than?
      switch (whichPicked('d', 'total')) {
        case 'd-more-than':
          filter += ' more than';
          query += ' >';
          break;
        case 'd-less-than':
          filter += ' less than';
          query += ' <';
          break;
        default:
          return;
      }
      // how many?
      let total = Number($('#e-total').val());
      if (!total || typeof total != 'number') return; //manual validation
      filter += ` ${total} people`;
      query += ` ${total}`;
      // year range
      filter += ` between ${startYear}-${endYear}`;
      query = yearRangeToSql(startYear, endYear) + query;
      break;
      //when "filter by how common" was used
    case 'a-common':
      filter += 'names that were';
      switch (whichPicked('d', 'common')) {
        case 'd-more-common':
          filter += ' more common than';
          query += ' >';
          break;
        case 'd-less-common':
          filter += ' less common than';
          query += ' <';
          break;
        default:
          return;
      }
      // how many?
      aFew = Number($('#e-common').val());
      if (!aFew || typeof aFew != 'number') return; // manual validation
      filter += ` ${aFew} per 750 people`;
      query += ` ${aFew}`;
      // where this name (1950, 1960) / newbornByYear(1950, 1960) * 750 < aFew
      // year range
      filter += ` between ${startYear}-${endYear}`;
      query = `${yearRangeToSql(startYear, endYear)} / ${newBornBetween(startYear, endYear)} * 750 ${query}`;
      break;
    case 'a-peak':
      filter += 'names that had a';
      switch (whichPicked('d', 'peak')) {
        case 'd-peak':
          filter = `${filter}names that had a peak between ${startYear} and ${endYear}`;
          query = `peak_year BETWEEN ${startYear} AND ${endYear}`;
          break;
        case 'd-trough':
          return; //trough isn't done yet.
          filter = `${filter}names that had a trough between ${startYear} and ${endYear}`;
          query = `trough_year BETWEEN ${startYear} AND ${endYear}`;
          break;
        default:
          return;
      }
      break;
    case 'a-popular':
      return; //popular is not done yet
    case 'a-trending':
      var trend;
      var percent = Number($('#e-trending').val());
      if (!percent || typeof percent != 'number') return; // manual validation
      switch (whichPicked('d', 'trending')) {
        case 'd-trending-up':
          filter += `names that are trending up by at least ${percent}% every year between ${startYear}-${endYear}`;
          trend = 'up';
          break;
        case 'd-trending-down':
          filter += `names that are trending down by at least ${percent}% every year between ${startYear}-${endYear}`;
          trend = 'down';
          break;
        default:
          return;
      }
      query = trendingToSql(Number(startYear), Number(endYear), trend, percent);
      break;
    default:
      return;
  }
  if (filter.includes('Exclude')) query = `!(${query})`; // reverse the query to !query
  populateFilter(filter);
  queries.push(query);
  runSql(queries);
  clearConsole();
}

function whichPicked(col, row) { // col is a letter like a, b, c, row is a row name like total, common, peak. Returns the id of radio button picked
  if (row) {
    for (let i of $(`.filter-col__${col} .filter-row__${row} input`))
      if (i.checked) return i.id;
  } else {
    for (let i of $(`.filter-col__${col} input`))
      if (i.checked) return i.id;
  }
}

function yearRangeToSql(startYear, endYear) { // this function turns a year range into a string ready for sql
  var res = '';
  for (var i = startYear; i <= endYear; i++) {
    res += '`' + i + '` + ';
  }
  res = res.slice(0, -3);
  return `(${res})`;
}

function trendingToSql(startYear, endYear, trend, percent) { // this function converts year into sql for trending
  var res = '';
  var portion;
  portion = (trend == 'up') ? 1 + percent / 100 : 1 - percent / 100;
  operator = (trend == 'up') ? '>' : '<';
  for (let i = startYear; i < endYear; i++) {
    res += '`' + (i + 1) + '`' + operator + '`' + i + '` * ' + portion + ' AND '
  }
  return res.slice(0, -5) //remove the last ' AND '
}
function populateFilter(string) { // this function puts a string onto the filter list
  var newFilter = `
    <label>
      <input type="checkbox" checked="checked">
      <span>${string}</span>
    </label>
    <a href="#!" class="secondary-content"><i class="material-icons theme2">delete</i></a>
    <a href="#!" class="secondary-content"><i class="material-icons theme2">edit</i></a>
  `;
  $('<li class="collection-item"></div>').append(newFilter).insertBefore('#filter-constructor');
}

function runSql(queries) { // this function sends a http GET to backend; anti-injection happens there
  var finalQuery = queries.join(') AND (');
  finalQuery = '(' + finalQuery + ')';
  finalQuery = `
  SELECT SQL_CALC_FOUND_ROWS name, gender FROM name_by_year
  WHERE ${finalQuery}
  ORDER BY sum DESC LIMIT 1000;
  SELECT FOUND_ROWS();
`;
  $.get('/api', {
    query: finalQuery
  }, populateNames);
}

function clearConsole() { // after a new filter is successfully added, clear the console
  for (let i of $('#filter-console input')) {
    i.checked = false;
    i.value = '';
  }
}

function unhide(row) { // this function unhides a row in the filter console
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__b li').show(); //unhide column b
  $('.' + row).show(); // unhide the selected row
}

function resultsInit() {
  runSql(['1+1=2']);
  $('#name-list').on('click', 'span', () => {
    let name = event.target.innerText;
    let gender = event.target.classList[0];
    populateModal(name, gender);
  });
}

function populateModal(name, gender) {
  $.get('/api/name', {
    name: name,
    gender: gender
  }, res => {
    var color = (res.gender == 'F') ? 'salmon' : '#00c2c2';
    $('#modal-title').html(`${res.name} <span> (per high school)</span>`);
    delete res.name;
    delete res.peak_year;
    delete res.sum;
    delete res.gender;
    delete res.is_unisex;
    delete res.id;
    for (let i in res) {
      res[i] = res[i] / newbornByYear[i] * 750; // change to per high school
    }
    var years = Object.keys(res);
    var counts = Object.values(res);
    chartjsInit(years, counts, color);
  });

  function chartjsInit(labels, data, color) {
    var ctx = document.getElementById("chart");
    var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: color,
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        scales: {
          yAxes: [{
            gridLines: {
              display: false
            }
          }],
          xAxes: [{
            gridLines: {
              display: false
            },
            scaleLabel: {
              display: false
            }
          }]
        }
      }
    });
  }
}

function populateNames(res) { // (temp) this function populates the screen the server res
  var count = res[1];
  if (count < 1000) $('#result-count').text(res[1] + ' names found...');
  else $('#result-count').text(res[1] + ' names found, displaying the first 1000...');
  $('#name-list').empty();
  for (let i of res[0]) {
    let name = i.slice(0, -1);
    let gender = i.slice(-1);
    $('#name-list').append(`<span class="${gender} modal-trigger" href="#modal">${name}</span>`);
  }
}

function slidersInit() {
  // the year range slider, using noUiSlider
  var slider = document.getElementById('year-slider');
  noUiSlider.create(slider, {
    start: [1950, 2016],
    connect: true,
    step: 1,
    direction: 'rtl', // smaller values first
    orientation: 'vertical', // 'horizontal' or 'vertical'
    range: {
      'min': 1880,
      'max': 2016
    },
    format: wNumb({
      decimals: 0
    })
  });
  var startYear = document.getElementById('start-year');
  var endYear = document.getElementById('end-year');
  slider.noUiSlider.on('update', () => {
    [startYear.innerHTML, endYear.innerHTML] = slider.noUiSlider.get();
  });
}

function materializeInit() {
  $('.collapsible').collapsible();
  // for the one and only html range in the app
  var slider = document.getElementById('c-popular__range');
  var output = document.getElementById("c-popular--value");
  output.innerHTML = slider.value; // display the default slider value
  slider.oninput = function() { // update the displayed value on dragging
    output.innerHTML = this.value;
  };
}

function newBornBetween(startYear, endYear) { // this function calculate how many babies were born in the US between two years
  var result = 0;
  for (var i = startYear; i <= endYear; i++) {
    result += newbornByYear[i];
  }
  return result;
}
