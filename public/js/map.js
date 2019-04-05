//Running a test on Seattle Washington

let popup, Popup, breweries;
// let location = require('../server.js');
// console.log(location);



function initMap() {
  let map = new google.maps.Map(document.getElementById('beer-map'), {
    zoom: 12,
    //we need to make this dynamic
    center: {lat: 47.608013, lng: -122.335167}
  });

  //bottle image
  let image = '/img/label_bottle.png'; 

  breweries.forEach(element =>{
    let beerMarker = new google.maps.Marker({
      position: {lat: element.lat, lng: element.lng},
      map: map,
      icon: image
    });
  });

  //initializes the popup
  Popup = createPopupClass();
  let popUpLat = element.lat + 0.012;
  popup = new Popup(
    new google.maps.LatLng(popUpLat, element.lng),
    document.getElementById('content'));
  popup.setMap(map);

  // //})
  // let beerMarker = new google.maps.Marker({
  //   //this will be tied to the brewery locations we pull from beerDB
  //   position: {lat: 47.580, lng: -122.402},
  //   map: map,
  //   icon: image
  // });

  // //initializes the popup
  // Popup = createPopupClass();
  // popup = new Popup(
  //   new google.maps.LatLng(47.592, -122.402),
  //   document.getElementById('content'));
  // popup.setMap(map);

}

//returns the popup class
function createPopupClass() {
  function Popup(position, content) {
    this.position = position;

    content.classList.add('popup-bubble');

    //zero position div that is positioned at bottom of bubble.
    let bubbleAnchor = document.createElement('div');
    bubbleAnchor.classList.add('popup-bubble-anchor');
    bubbleAnchor.appendChild(content);

    //zero position div that is positioned at the bottom of tip.
    this.containerDiv = document.createElement('div');
    this.containerDiv.classList.add('popup-container');
    this.containerDiv.appendChild(bubbleAnchor);

    //stops clicks from bubbling up to map.
    google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.containerDiv);
  }

  //ES5 step to extend the google.maps.OverlayView.
  Popup.prototype = Object.create(google.maps.OverlayView.prototype);

  //called when the popup is added to the map.
  Popup.prototype.onAdd = function() {
    this.getPanes().floatPane.appendChild(this.containerDiv);
  };
  //called when the popup is removed from the map.
  Popup.prototype.onRemove = function () {
    if (this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv);
    }
  };
  //called when prototype needs to draw itself.
  Popup.prototype.draw = function() {
    let divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
    let display = Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
      'block' :
      'none';

    if (display === 'block') {
      this.containerDiv.style.left = divPosition.x + 'px';
      this.containerDiv.style.top = divPosition.y + 'px';
    }
    if (this.containerDiv.style.display !== display) {
      this.containerDiv.style.display = display;
    }
  };
  return Popup;
}
