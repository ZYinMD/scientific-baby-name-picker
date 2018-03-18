$('#test-query').on('submit', (e) => {
  e.preventDefault();
  var query = ($('#test-query__input').val().trim());
  $.get('/api', {query: query}, populateResult);
})

function populateResult(res) {
  var display = '';
  for (let i in res) {
    display += `result #${i}: ${JSON.stringify(res[i])}\n`;
  }


  $('#mockup').empty().append($('<pre>'))

  $('pre').text(display);
}

//this temporary function format the res from server
function formatRes(res) {
}
