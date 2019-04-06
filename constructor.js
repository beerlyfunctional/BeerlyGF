
//Constructor Function for beer
function Beer(input) {
  this.name = input.name;
  this.beer_id = input.id;
  this.abv = input.abv ? input.abv : 'Not Avaliable';
  this.ibu = input.ibu ? input.ibu : 'Not Avaliable';
  this.time_stamp = Date.now();
  this.style_id = input.style.id;
  this.brewery_id = input.breweries[0].id;
}

function Style(input) {
  this.id = input.id;
  this.name = input.name;
  this.description = input.description ? input.description : '';
  this.abvmin = input.abvMin ? input.abvMin : 'Not Avaliable';
  this.abvmax = input.abvMax ? input.abvMax : 'Not Avaliable';
  this.ibumin = input.ibuMin ? input.ibuMin : 'Not Avaliable';
  this.ibumax = input.ibuMax ? input.ibuMax : 'Not Avaliable';
  this.time_stamp = Date.now();
}

function Brewery(input) {
  this.id = input.breweryId;
  this.brewery = input.brewery ? input.brewery.name : 'Not Avaliable';
  this.website = input.brewery.website ? input.brewery.website : 'Not Avaliable';
  this.image = input.brewery.images ? input.brewery.images.squareMedium.replace(/http:\/\//i, 'https://') : '/img/alcohol-alcoholic-beer-1161466.jpg';
  this.lat = input.latitude;
  this.long = input.longitude;
  this.time_stamp = Date.now();
}

function Location(input, location){
  this.search_query = location;
  this.lat = input.lat;
  this.long = input.lng;
}

function Review(input) {
  this.beer_id = input.beer_id;
  this.note = input.review ? input.review : '';
  this.rating = input.rating !== 0 ? input.rating : 0;
  this.time_stamp = Date.now();
  this.gf = input.gf === 'on' ? true : false;
}

module.exports = {Beer, Style, Brewery, Location, Review};
