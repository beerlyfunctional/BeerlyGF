
//Constructor Function for beer
function Beer(input) {
  this.name = input.name;
  this.beer_id = input.id;
  this.abv = input.abv ? input.abv : null;
  this.ibu = input.ibu ? input.ibu : null;
  this.usernote = '';
  this.userrating = 0;
  this.numvotes = 0;
  this.time_stamp = Date.now();
}

function Style(input) {
  this.id = input.id;
  this.name = input.name;
  this.description = input.description;
  this.abvmin = input.abvMin;
  this.abvmax = input.abvMax;
  this.ibumin = input.ibuMin;
  this.ibumax = input.ibuMax;
  this.time_stamp = Date.now();
}

function Brewery(input) {
  this.id = input.id;
  this.brewery = input.name;
  this.website = input.website ? input.website : null;
  this.image = input.images ? input.images.squareMedium.replace(/http:\/\//i, 'https://') : '/img/alcohol-alcoholic-beer-1161466.jpg';
  this.lat = input.latitude;
  this.long = input.longitude;
  this.time_stamp = Date.now();
}

function Location(input, zip){
  this.zip = zip;
  this.lat = input.lat;
  this.long = input.lng;

}

module.exports = {Beer, Style, Brewery, Location};
