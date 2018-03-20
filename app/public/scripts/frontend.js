initialize();
function initialize() { // this function get run on page load
// temp: enter queries in the query bar to run a query
$('#test-query').on('submit', (event) => {
  event.preventDefault();
  var query = ($('#test-query__input').val().trim());
  $.get('/api', {query: query}, populateNames);
});


  // filter behavior:
  $('.filter-row:not(.filter-col--a p)').toggleClass('hidden', true); //hide everything except first column
  $('.filter-col--a').on('change', 'input', (event) => { // when any filter is chosen, unhide its row
    unhide(event.target.parentNode.classList[1]);
  });
}

function unhide(row) {
  $('.filter-row:not(.filter-col--a p)').toggleClass('hidden', true); //hide everything except first column
  $('.filter-col--b p').toggleClass('hidden', false); //unhide column b
  $('.' + row).toggleClass('hidden', false); // unhide the selected row

}

function populateNames(res) { // this function populates the screen the server res
  var display = '';
  for (let i in res) {
    display += `result #${i}: ${JSON.stringify(res[i])}\n`;
  }
  $('#name-list').empty().append($('<pre>'));
  $('pre').text(display);
}


