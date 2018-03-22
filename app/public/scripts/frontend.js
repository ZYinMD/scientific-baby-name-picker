pageInit();
materializeInit();
slidersInit();
testQueryInit();

function pageInit() { // this function get run on page load
  // temp: enter queries in the query bar to run a query

  // change text color of selected radio
  $('#filter-console input').on('change', (event) => {
    console.log('event.target.parentNode: ', event.target.parentNode);
    console.log('event.target.parentNode.parentNode: ', event.target.parentNode.parentNode);
    console.log('event.target.checked: ', event.target.checked);
  });
  $('.filter-row').on('click', () => {
    console.log('event.currentTarget', event.currentTarget);
  });
  // filter hide/show:
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__a').on('change', 'input', (event) => { // when any filter is chosen, unhide its row
    unhide(event.target.parentNode.parentNode.classList[1]);
  });
}

function unhide(row) {
  $('.filter-row:not(.filter-col__a li)').hide(); //hide everything except first column
  $('.filter-col__b li').show(); //unhide column b
  $('.' + row).show(); // unhide the selected row
}

function populateNames(res) { // this function populates the screen the server res
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
  $('#test-query').on('submit', (event) => {
    event.preventDefault();
    var query = ($('#test-query__input').val().trim());
    $.get('/api', {
      query: query
    }, populateNames);
  });
}
