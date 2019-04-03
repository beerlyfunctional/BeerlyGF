'use strict';
// following function has been amended from an example initially found on W3 schools. https://www.w3schools.com/js/js_cookies.asp
function getCookie(agedCookies) {
  let name = agedCookies + '=';
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i=0; i<ca.length; i++) {
    let c = ca[i];
    while(c.charAt[0] === ' ') {
      c = c.slice(1)
    }
    if(c.indexOf(name) === 0) {
      return c.slice(name.length, c.length);
    }
  }
  return '';
}

function checkCookie() {
  let value = getCookie(agedCookies);
  if (value === '21Years') {
    $('#agePop').attr('style', 'display: none');
  }
}

$('#yes').on('click', function (){
  $('#agePop').attr('style', 'display: none');
  document.cookie('agedCookies', '21Years', {expires : 1, path: "/" });
})

$('#no').on('click', function (){
  window.location.replace('https://www.google.com');
})



