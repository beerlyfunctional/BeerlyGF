//Running a test on Seattle Washington

// let popup, Popup, breweries;
// let location = require('../server.js');
// console.log(location);



function initMap() {
  $.ajax({
    url: '/breweries',
    type: 'GET',
    success: function(response) {
      console.log(response);
      let map = new google.maps.Map(document.getElementById('beer-map'), {
        zoom: 12,
        center: { lat: parseFloat(response.location.lat), lng: parseFloat(response.location.long) }
      });

      //bottle image
      let image = '/img/beerMarker.png';

      response.breweries.forEach(element =>{
        console.log('-----------------------------')
        console.log(element)
        console.log(element.lat)
        let beerMarker = new google.maps.Marker({
          position: {lat: parseFloat(element.lat), lng: parseFloat(element.long)},
          map: map,
          icon: image
        });

        let infowindow = new google.maps.InfoWindow({
          content: `${element.brewery}, /<a href = '/breweries/${element.id}'> View more info! </a>`
        });

        // infowindow.open(map, beerMarker);

        var previousMarker = false;

        google.maps.event.addListener(beerMarker, 'click', function() {
          if(previousMarker){
            previousMarker.close();
          }
          infowindow.open(map, beerMarker);
          previousMarker = infowindow;
        })
        // console.log(beerMarker)
        beerMarker.setMap(map);
      });
      console.log('done')
    }
  });

}
