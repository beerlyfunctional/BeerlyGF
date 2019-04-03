const superagent = require('superagent');
const constructor = require('./constructor.js');

//get that client realness

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => errorHandler(error));

//helper functions
function errorHandler(error, message, res) {
  console.error(error);
  if(message) {
    console.log('Error message:', message);
    if(res){
      res.send(message);
    }
  }
}

//fetch lat long
function fetch_lat_long(request, response){
  let zip = request.body.zip;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}&address=${zip}`;
  superagent.get(url)
    .then(data=>{
      console.log('🗺 from the googs');
      if(!data.body.results.length) throw 'Where are we??? Nothing back from GeoCodeAPI';

      else{
        let location = new constructor.Location(data.body.results[0].geometry.location, zip);

        let sql = `INSERT INTO locations(zip, lat, lng) VALUES($1, $2, $3);`;
        let values = Object.values(location);
        client.query(sql, values)
          .catch(error => errorHandler(error));

      }
      
    })
    .catch();
}


//render map

//fetch breweries

//fetch all beers from a single brewery


module.exports = { getBeer, errorHandler};
