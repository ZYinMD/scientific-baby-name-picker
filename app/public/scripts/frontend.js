filterInit();
materializeInit();
slidersInit();
testQueryInit();

function filterInit() { // this function get run on page load
  // filter hide/show:
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__a').on('change', 'input', (event) => { // when any filter is chosen, unhide its row
    unhide(event.target.parentNode.parentNode.classList[1]);
  });
  $('#filter-apply a').on('click', applyFilter);
}



function applyFilter() {
  $('.collapsible').collapsible('close', 0);
  var filter = '';
  var query = '';
  // get over with include / exclude first
  if (whichPicked('b') == 'b-exclude') filter += 'Exclude ';
  else if (whichPicked('b') == 'b-include') filter += 'Include only ';
  else return;

  switch (whichPicked('a')) {
    case 'a-gender':
      let filterArray = [];
      let queryArray = [];
      for (let i of $('.filter-col__c input')) {
        if (i.checked) {
          switch (i.nextElementSibling.innerText) {
            case 'girl names':
              filterArray.push('girl names');
              queryArray.push("gender = 'F'")
              break;
            case 'boy names':
              filterArray.push('boy names');
              queryArray.push("gender = 'M'")
              break;
            case 'unisex names':
              filterArray.push('unisex names');
              queryArray.push("is_unisex = 1")
              break;
            default:
              return;
          }
        }
      }
      filter += filterArray.join(' and ');
      query += queryArray.join(' AND ');
      if (filter.includes('Exclude')) {
        query = `!(${query})`;
      }
      break;
    case 'a-total':
      filter += 'names that have been used by ';
      switch (whichPicked('d')) {
        case 'd-more-than':
          filter += 'more than ';
          query += ' > ';
          break;
        case 'd-less-than':
          filter += 'less than ';
          query += ' < ';
          break;
        default:
          return;
      }
      break;
    case 'a-common':
      console.log('which filter: ', filterType);
      console.log('exclusion: ', whichPicked('b'));
      break;
    case 'a-peak':
      console.log('which filter: ', filterType);
      console.log('exclusion: ', whichPicked('b'));
      break;
    case 'a-popular':
      console.log('which filter: ', filterType);
      console.log('exclusion: ', whichPicked('b'));
      break;
    case 'a-trending':
      console.log('which filter: ', filterType);
      console.log('exclusion: ', whichPicked('b'));
      break;
    default:
      return;
  }

  displayFilter(filter);
  runQuery(query);
  clearConsole();

  function whichPicked(col) { //takes a letter like 'a' / 'b' / 'c', returns what radio was picked
    for (let i of $(`.filter-col__${col} input`)) if (i.checked) return i.id;
  }

}

function displayFilter(string) { // this function puts a string onto the filter list
  var newFilter = `
    <label>
      <input type="checkbox">
      <span>${string}</span>
    </label>
    <a href="#!" class="secondary-content"><i class="material-icons theme2">delete</i></a>
    <a href="#!" class="secondary-content"><i class="material-icons theme2">edit</i></a>
  `;
  $('<li class="collection-item"></div>').append(newFilter).insertBefore('#filter-constructor');
}

function runQuery(string) { // this function sends a http GET with queryString being param string
  console.log('query: ', string);
}

function clearConsole() { // after a new filter is successfully added, clear the console
  for (let i of $('#filter-console input')) {
    i.checked = false;
  }
}

function unhide(row) { // this function unhides a row in the filter console
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__b li').show(); //unhide column b
  $('.' + row).show(); // unhide the selected row
}

function populateNames(res) { // (temp) this function populates the screen the server res
  var display = '';
  for (let i in res) {
    display += `result #${i}: ${JSON.stringify(res[i])}\n`;
  }
  $('#name-list').empty().append($('<pre>'));
  $('pre').text(display);
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

function testQueryInit() {
  // temp: enter queries in the query bar to run a query
  $('#test-query').on('submit', (event) => {
    event.preventDefault();
    var query = ($('#test-query__input').val().trim());
    $.get('/api', {
      query: query
    }, populateNames);
  });
}
