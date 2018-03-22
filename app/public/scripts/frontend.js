pageInitialize();
materializeInitialize();

function materializeInitialize() {
  $('.collapsible').collapsible();
}

function pageInitialize() { // this function get run on page load
// temp: enter queries in the query bar to run a query
$('#test-query').on('submit', (event) => {
  event.preventDefault();
  var query = ($('#test-query__input').val().trim());
  $.get('/api', {query: query}, populateNames);
});

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
  $('.filter-row:not(.filter-col--a li)').hide(); //hide everything except first column
  $('.filter-col--a').on('change', 'input', (event) => { // when any filter is chosen, unhide its row
    unhide(event.target.parentNode.parentNode.classList[1]);
  });
}

function unhide(row) {
  $('.filter-row:not(.filter-col--a li)').hide(); //hide everything except first column
  $('.filter-col--b li').show(); //unhide column b
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


