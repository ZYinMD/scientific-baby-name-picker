appInit();
materializeInit(); // materialize animations: collapsible, tooltip, etc
slidersInit(); // nonUiSlider.js
resultsInit(); // default first query
searchInit(); //the search bar on upper right
favoriteInit(); // functionality of favorite
filterInit(); // hide and show of filter rows

function appInit() {
  $('#logo').on('click', () => {
    location.reload();
  });
  if (localStorage.previousFilters) {
    $('#filters').html(localStorage.getItem('previousFilters')); // restore the filters created last time
  }
  $('#year-slider').empty(); // after restoring previous filters, empty the slider, otherwise there'd be a bug
}

function filterInit() { // hide and show of filter rows and columns
  $('#filters').on('change', '.togglable-filter', apiCall); // uncheck to temporarily disable a filter
  $('#filters').on('click', '.delete-button', (event) => { // press a button to delete a filter
    event.target.parentNode.parentNode.remove();
    apiCall();
  });
  // filter constructor console init:
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__a').on('change', 'input', (event) => { // when any filter is chosen, unhide its row
    unhide(event.target.parentNode.parentNode.classList[1]);
  });
  $('#filter-apply a').on('click', applyFilter);
}

function applyFilter() { // this function gets run when the apply filter button is clicked
  var flagFilterComplete = false;
  var filterIncomplete = function() {
    M.toast({
      html: "You didn't finish constructing the filter"
    });
  };
  for (let i = 0; i < 10; i++) { //stupidest thing ever. Materialized can only collapse the number n item in the list for me
    $('.collapsible').collapsible('close', i);
  }
  var filter = '';
  var data = {};
  // get over with include / exclude first
  if (whichPicked('b') == 'b-exclude') {
    filter += 'Exclude ';
    data.b = 'exclude';
  } else if (whichPicked('b') == 'b-include') {
    filter += 'Include only ';
    data.b = 'include';
  } else return filterIncomplete(); // validation: if nothing picked, do nothing
  // get over with year range
  var startYear = data.startYear = Number($('#start-year').text());
  var endYear = data.endYear = Number($('#end-year').text());
  switch (whichPicked('a')) { // switch what kind of filter was picked in column a
    //when "filter by gender" was used
    case 'a-gender': {
      data.a = 'gender';
      let gendersChecked = [];
      data.gendersChecked = [];
      for (let i of $('.filter-col__c input')) { // all three checkboxes
        if (i.checked) {
          flagFilterComplete = true;
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
              return console.log('Something went wrong');
          }
        }
      }
      if (!flagFilterComplete) return filterIncomplete();
      filter += gendersChecked.join(' and ');
      break;
      //when "filter by total birth" was used
    }
    case 'a-total': {
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
          return filterIncomplete();
      }
      // how many?
      let total = Number($('#e-total').val());
      if (!total || typeof total != 'number') return filterIncomplete(); //manual validation
      filter += ` ${total} people`;
      data.howMany = total;
      // year range
      filter += ` between ${startYear}-${endYear}`;
      break;
      // when "filter by birth per year is used"
    }
    case 'a-peryear': {
      data.a = 'peryear';
      filter += 'names that had';
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
          return filterIncomplete();
      }
      // how many?
      let peryear = Number($('#e-peryear').val());
      if (!peryear || typeof peryear != 'number') return filterIncomplete(); //manual validation
      filter += ` ${peryear} new births per year on average`;
      data.howMany = peryear;
      // year range
      filter += ` between ${startYear}-${endYear}`;
      break;
      //when "filter by how common" was used
    }
    case 'a-common': {
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
          return filterIncomplete();
      }
      // how many?
      let aFew = Number($('#e-common').val());
      if (!aFew || typeof aFew != 'number') return filterIncomplete(); // manual validation
      data.howMany = aFew;
      filter += ` ${aFew} per 750 people between ${startYear}-${endYear}`;
      break;
    }
    case 'a-peak':
      data.a = 'peak';
      switch (whichPicked('d', 'peak')) {
        case 'd-peak':
          filter = `${filter}names that had a peak between ${startYear} and ${endYear}`;
          break;
        case 'd-trough':
          return; //trough isn't done yet.
          // filter = `${filter}names that had a trough between ${startYear} and ${endYear}`;
          // break;
        default:
          return filterIncomplete();
      }
      break;
    case 'a-popular': {
      // filter: Exclude the most popular 300 names between 1950-2016;
      data.a = 'popular';
      // how many?
      let top = Number($('#c-popular--value').text());
      data.howMany = top;
      filter += `the most popular ${top} names between ${startYear}-${endYear}`;
      break;
    }
    case 'a-trending':
      data.a = 'trending';
      var trend;
      var percent = Number($('#e-trending').val());
      if (!percent || typeof percent != 'number') return filterIncomplete(); // manual validation
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
          return filterIncomplete();
      }
      data.trend = trend;
      data.percent = percent;
      break;
    default:
      return filterIncomplete();
  }
  populateFilter(filter, data);
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

function populateFilter(filter, data) { // this function puts a sentence onto the filter list
  var newFilter = `
    <label>
      <input class="togglable-filter" type="checkbox" checked="checked">
      <span data-conditions='${JSON.stringify(data)}'>${filter}</span>
    </label>
    <a href="#!" class="secondary-content"><i class="material-icons delete-button theme2">delete</i></a>
    <a href="#!" class="secondary-content"><i class="material-icons edit-button theme2 tooltipped" data-tooltip="Sorry, this is a make-believe button for now.\n To edit a filter, just delete and redo it.">edit</i></a>
  `;
  $('<li class="collection-item"></div>').append(newFilter).insertBefore('#filter-constructor');
  $('.tooltipped').tooltip(); // to make sure the newly added tooltip works
}

function apiCall() { // this function collects all current filters and sends an http GET to backend
  var query = {};
  query.fromClauses = [];
  query.whereClauses = [];
  for (let i of $('[data-conditions]')) {
    if (i.parentNode.firstElementChild.checked == false) continue; // if the checkbox is not checked, the filter is disabled
    i = JSON.parse(i.dataset.conditions);
    i.a == 'popular' ?
      query.fromClauses.push(i) :
      query.whereClauses.push(i);
  }
  $.get('/api', query, populateNames);
  // store current filter list so it'd still be preserved on next refresh
  setTimeout(() => {
    localStorage.setItem('previousFilters', $('#filters').html());
  }, 1000);
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
  apiCall(); // call with the initial one filter, which is the default filter
  $('#name-list').on('click', 'span', (event) => { // when a name is clicked, show a bottom modal to display its detail and chart
    let name = event.target.innerText;
    let gender = event.target.classList[0];
    populateModal(name, gender);
  });
  $('#variations').on('click', 'span:not(.self)', (event) => { // when a variant of a name is clicked, do the same
    var name = event.target.innerText;
    var gender = event.target.classList[0];
    populateModal(name, gender);
  });

  $.get('/api/newbornByYear', res => {
    newbornByYear = res; // this is a global variable declared without "var"
  });
}

function populateModal(name, gender) {
  if (!gender) gender = null; //if gender was not provided (this happens when user uses the search bar)
  $('#chart').remove();
  $.get('/api/name', {
    name,
    gender
  }, res => {
    if (res.name == 'Name not found') {
      $('#modal-title').text(`Name "${name}" not found.`);
      $('#variations').text(''); //empty the variations from last time
      return;
    }
    displayName(res.name, res.gender, res.similar); // show name as modal title, and attach a heart
    var color = (res.gender == 'F') ? 'salmon' : '#00c2c2';
    delete res.name;
    delete res.peak_year;
    delete res.sum;
    delete res.gender;
    delete res.domGender;
    delete res.id;
    delete res.similar;
    for (let i in res) {
      res[i] = res[i] / newbornByYear[i] * 750; // change to per high school
    }
    var years = Object.keys(res);
    var counts = Object.values(res);
    chartjsInit(years, counts, color); // draw the chart
  });
}

function displayName(name, gender, variations) { // this function displays a name as well as the heart in the modal title
  $('#modal-title').html(`
    <span id="heart" data-name=${name} data-gender=${gender}>
      <i class="material-icons">favorite_border</i>
    </span>${name}<a href="https://www.behindthename.com/name/${name}/comments" target="_blank"><i class="material-icons tooltipped" data-tooltip="external link to www.behindthename.com">exit_to_app</i></a>
    `);
  $('#variations').text('Variations (common first) :  ');
  for (let i of variations.split(',')) {
    if (i == name+gender) {
      $('#variations').append(`<span class="${gender} variant self">${name}</span>`); // if it's itself
    } else {
      $('#variations').append(`<span class="${i.slice(-1)} variant">${i.slice(0, -1)}</span>`);
    }

  }
  if (isFavorite(name, gender)) {
    $('#heart').toggleClass('favorite', true);
    $('#heart i').text('favorite');
  }
  $('.tooltipped').tooltip();
}

function favoriteInit() {
  if (!localStorage.getItem('favNames')) { //if localStorage for favs doesn't exist yet, create it
    localStorage.setItem('favNames', '{}');
  }
  $('#modal-title').on('click', '#heart', toggleFav);
  $('#header__favorites').on('click', displayFavs);
}

function displayFavs() { // this function retrieves favorites from localStorage and displays it
  var favList = JSON.parse(localStorage.getItem('favNames'));
  var names = Object.keys(favList);
  populateNames([names, names.length]);
  $('#back-from-fav').show().html(`<p onClick="apiCall()">BACK</p>`); // unhide it
}

function toggleFav() { // this function toggles the red / grey heart, and also change the corresponding status in localStorage
  $(this).toggleClass('favorite');
  var favList = JSON.parse(localStorage.getItem('favNames'));
  var key = $(this)[0].dataset.name + $(this)[0].dataset.gender; // use name concatenated with one letter gender as key
  if ($(this)[0].classList[0] == 'favorite') { // if has the class of favorite, then the heart is now red
    $('#heart i').text('favorite');
    favList[key] = 1; // add this name into favList
  } else {
    $('#heart i').text('favorite_border');
    delete favList[key]; // delete this name into favList
  }
  localStorage.setItem('favNames', JSON.stringify(favList));
}

function isFavorite(name, gender) { // this function checks if a name is already in favorite
  var favList = JSON.parse(localStorage.getItem('favNames'));
  return favList[name + gender] ? true : false;
}

function chartjsInit(labels, data, color) {
  // remove and re-add the canvas area every time before generating a new chart
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
          },
          pointLabels: {
            display: true
          },
          scaleLabel: {
            display: true,
            labelString: 'Per High School',
            fontSize: 12
          }
        }],
        xAxes: [{
          gridLines: {
            display: false
          },
          ticks: {
            maxTicksLimit: 30
          }

        }]
      }
    }
  });
}

function populateNames(res) { // this function populates the screen with the server res
  var count = res[1];
  if (count == 1) $('#result-count').text(res[1] + ' name found...');
  else if (count <= 2000) $('#result-count').text(res[1] + ' names found:');
  else $('#result-count').text(res[1] + ' names found, displaying the first 2000:');
  $('#name-list').empty();
  for (let i of res[0]) {
    let name = i.slice(0, -1);
    let gender = i.slice(-1);
    $('#name-list').append(`<span class="${gender} modal-trigger" href="#modal">${name}</span>`);
  }
  $('#back-from-fav').hide(); //this is the "BACK" button when showing favorites, normally hidden
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

function searchInit() {
  $('#search').on('submit', (event) => {
    event.preventDefault();
    var name = $('#search input').val().trim();
    if (name == '') return;
    $('#modal').modal('open');
    $('#search input').val('');
    populateModal(name);
  });
}
