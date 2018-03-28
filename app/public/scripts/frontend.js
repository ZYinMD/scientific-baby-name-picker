var queries = []; // global variable to store all filters for sql
var newbornByYear = 1;
resultsInit(); // default first query
filterInit(); // hide and show of filter rows
materializeInit(); // materialize animations: collapsible, tooltip, etc
slidersInit(); // nonUiSlider.js
function filterInit() { // hide and show of filter rows and columns
  // filter hide/show:
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__a').on('change', 'input', (event) => { // when any filter is chosen, unhide its row
    unhide(event.target.parentNode.parentNode.classList[1]);
  });
  $('#filter-apply a').on('click', applyFilter);
}

function applyFilter() { // this function gets run when the apply filter button is clicked
  for (let i = 0; i < 10; i++) { //stupidest thing ever. Materialized can only collapse the number n item in the list for me
    $('.collapsible').collapsible('close', i);
  }
  var filter = '';
  var query = '';
  var data = {};
  // get over with include / exclude first
  if (whichPicked('b') == 'b-exclude') {
    filter += 'Exclude ';
    data.b = 'exclude';
  } else if (whichPicked('b') == 'b-include') {
    filter += 'Include only ';
    data.b = 'include';
  } else return; // validation: if nothing picked, do nothing
  // get over with year range
  var startYear = data.startYear = Number($('#start-year').text());
  var endYear = data.endYear = Number($('#end-year').text());
  switch (whichPicked('a')) { // switch what kind of filter was picked in column a
    //when "filter by gender" was used
    case 'a-gender':
      data.a = 'gender';
      let gendersChecked = [];
      data.gendersChecked = [];
      for (let i of $('.filter-col__c input')) { // all three checkboxes
        if (i.checked) {
          switch (i.nextElementSibling.innerText) {
            case 'girl names':
              gendersChecked.push('girl names');
              data.gendersChecked.push('F');
              break;
            case 'boy names':
              gendersChecked.push('boy names');
              data.gendersChecked.push('M');
              break;
            case 'unisex names':
              gendersChecked.push('unisex names');
              data.gendersChecked.push('U');
              break;
            default:
              return;
          }
        }
      }
      filter += gendersChecked.join(' and ');
      /*      // I am so smart:
            filter.includes('Exclude') ?
              query += gendersQuery.join(' OR ') :
              query += gendersQuery.join(' AND ');*/
      break;
      //when "filter by total birth" was used
    case 'a-total':
      data.a = 'total';
      filter += 'names that have been used by';
      // more than or less than?
      switch (whichPicked('d', 'total')) {
        case 'd-more-than':
          filter += ' more than';
          data.operator = '>';
          break;
        case 'd-less-than':
          filter += ' less than';
          data.operator = '<';
          break;
        default:
          return;
      }
      // how many?
      let total = Number($('#e-total').val());
      if (!total || typeof total != 'number') return; //manual validation
      filter += ` ${total} people`;
      /*query += ` ${total}`;*/
      data.howMany = total;
      // year range
      filter += ` between ${startYear}-${endYear}`;
      /*query = yearRangeToSql(startYear, endYear) + query;*/
      break;
      //when "filter by how common" was used
    case 'a-common':
      data.a = 'common';
      filter += 'names that were';
      switch (whichPicked('d', 'common')) {
        case 'd-more-common':
          filter += ' more common than';
          data.operator = '>';
          break;
        case 'd-less-common':
          filter += ' less common than';
          data.operator = '<';
          break;
        default:
          return;
      }
      // how many?
      aFew = Number($('#e-common').val());
      if (!aFew || typeof aFew != 'number') return; // manual validation
      filter += ` ${aFew} per 750 people`;
      /*query += ` ${aFew}`;*/
      data.howMany = aFew;
      // where this name (1950, 1960) / newbornByYear(1950, 1960) * 750 < aFew
      // year range
      filter += ` between ${startYear}-${endYear}`;
      /*query = `${yearRangeToSql(startYear, endYear)} / ${newBornBetween(startYear, endYear)} * 750 ${query}`;*/
      break;
    case 'a-peak':
      data.a = 'peak';
      switch (whichPicked('d', 'peak')) {
        case 'd-peak':
          filter = `${filter}names that had a peak between ${startYear} and ${endYear}`;
          /*query = `peak_year BETWEEN ${startYear} AND ${endYear}`;*/
          break;
        case 'd-trough':
          return; //trough isn't done yet.
          filter = `${filter}names that had a trough between ${startYear} and ${endYear}`;
          /*query = `trough_year BETWEEN ${startYear} AND ${endYear}`;*/
          break;
        default:
          return;
      }
      break;
    case 'a-popular':
      return; //popular is not done yet
    case 'a-trending':
      data.a = 'trending';
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
      /*query = trendingToSql(Number(startYear), Number(endYear), trend, percent);*/
      data.trend = trend;
      data.percent = percent;
      break;
    default:
      return;
  }
  /*if (filter.includes('Exclude')) query = `!(${query})`; // reverse the query to !query*/
  populateFilter(filter, data);
  /*queries.push(query);*/
  apiCall();
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

function trendingToSql(startYear, endYear, trend, percent) { // this function converts year into sql for trending
  var res = '';
  var portion;
  portion = (trend == 'up') ? 1 + percent / 100 : 1 - percent / 100;
  operator = (trend == 'up') ? '>' : '<';
  for (let i = startYear; i < endYear; i++) {
    res += '`' + (i + 1) + '`' + operator + '`' + i + '` * ' + portion + ' AND ';
  }
  return res.slice(0, -5); //remove the last ' AND '
}

function populateFilter(filter, data) { // this function puts a sentence onto the filter list
  var newFilter = `
    <label>
      <input type="checkbox" checked="checked">
      <span data-conditions='${JSON.stringify(data)}'>${filter}</span>
    </label>
    <a href="#!" class="secondary-content"><i class="material-icons theme2">delete</i></a>
    <a href="#!" class="secondary-content"><i class="material-icons theme2">edit</i></a>
  `;
  $('<li class="collection-item"></div>').append(newFilter).insertBefore('#filter-constructor');
}

function apiCall() { // this function sends a http GET to backend; anti-injection happens there
  var query = {};
  query.conditions = [];
  for (let i of $('[data-conditions]')) {
    i = JSON.parse(i.dataset.conditions);
    if (i.a == 'popular') {
      query.pool = i;
    } else {
      query.conditions.push(i);
    }
  }
  $.get('/api', query, populateNames);
}

function clearConsole() { // after a new filter is successfully added, clear the console
  for (let i of $('#filter-console input')) {
    i.checked = false;
    i.value = '';
  }
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
}

function unhide(row) { // this function unhides a row in the filter console. Takes a class name
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__b li').show(); //unhide column b
  $('.' + row).show(); // unhide the selected row
}

function resultsInit() {
   apiCall();
  //   conditions: ['1+1=2']
  // }); // equal to select * from table
  $('#name-list').on('click', 'span', () => { // when a name is clicked, show a bottom modal to display its detail and chart
    let name = event.target.innerText;
    let gender = event.target.classList[0];
    populateModal(name, gender);
  });
  $.get('/api/newbornByYear', res => {
    newbornByYear = res;
  });
}

function populateModal(name, gender) {
  $.get('/api/name', {
    name,
    gender
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
    chartjsInit(years, counts, color); // draw the chart
  });

  function chartjsInit(labels, data, color) {
    // remove and re-add the canvas area every time before generating a new chart
    $('#chart').remove();
    $('.chart-container').append('<canvas id="chart"></canvas>');
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

function populateNames(res) { // this function populates the screen the server res
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
  // for the one and only html range in the app
  var range = document.getElementById('c-popular__range');
  var output = document.getElementById("c-popular--value");
  output.innerHTML = range.value; // display the default range value
  range.oninput = function() { // update the displayed value on dragging
    output.innerHTML = this.value;
  };
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
    [startYear.innerHTML, endYear.innerHTML] = slider.noUiSlider.get(); // update the dom display on slider change
  });
}

function materializeInit() {
  $('.collapsible').collapsible();
  $('.tooltipped').tooltip();
  $('.modal').modal();
}

function newBornBetween(startYear, endYear) { // this function calculate how many babies were born in the US between two years
  var result = 0;
  for (var i = startYear; i <= endYear; i++) {
    result += newbornByYear[i];
  }
  return result;
}
