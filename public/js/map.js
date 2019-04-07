//generates map with brewery locations
function initMap() {
  $.ajax({
    url: '/breweries',
    type: 'GET',
    success: function(response) {
      console.log(response);
      //produce the google map based on location selected
      let map = new google.maps.Map(document.getElementById('beer-map'), {
        zoom: 12,
        center: { lat: parseFloat(response.location.lat), lng: parseFloat(response.location.long) }
      });

      //beer bottle marker image
      let image = '/img/label_bottle.png';

      //place marker based on brewery location
      response.breweries.forEach(element =>{
        console.log('-----------------------------')
        console.log(element)
        console.log(element.lat)
        let beerMarker = new google.maps.Marker({
          position: {lat: parseFloat(element.lat), lng: parseFloat(element.long)},
          map: map,
          icon: image
        });
        //marker content bubble that includes brewery name and link
        let infowindow = new google.maps.InfoWindow({
          content: `${element.brewery}, /<a href = '/breweries/${element.id}'> View more info! </a>`
        });

        var previousMarker = false;

        //listener linked to brewery marker - activated when user clicks on link
        google.maps.event.addListener(beerMarker, 'click', function() {
          if(previousMarker){
            previousMarker.close();
          }
          infowindow.open(map, beerMarker);
          previousMarker = infowindow;
        })
        beerMarker.setMap(map);
      });
    }
  });

}
