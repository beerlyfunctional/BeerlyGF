const superagent = require('superagent');
const constructor = require('./constructor.js');

//get that client realness

const pg = require('pg');
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

// Search function
function search(request, response) {
  // check database to see if data is in DB
  let zip = request.body.zip;
  let values = [zip];
  let sql = `SELECT * FROM locations WHERE zip=$1;`;

  client.query(sql, values)
    .then(result => {
      if (result.rowCount > 0) {
        //transfer control over to map function -> which will do the rendering

      }
      else fetch_lat_long(zip)
        .then(locationResult => {
          if (result.rowCount > 0) throw 'DATABASE INSERT FAILED (((OHNOES!!!)))';
          else {
            // transfer to map function
          }
        })
        .catch(error => errorHandler(error));
    })
}

//fetch lat long
function fetch_lat_long(zip){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}&address=${zip}`;
  superagent.get(url)
    .then(data=>{
      console.log('🗺 from the googs');
      if(!data.body.results.length) throw 'Where are we??? Nothing back from GeoCodeAPI';

      else{
        let location = new constructor.Location(data.body.results[0].geometry.location, zip);

        let sql = `INSERT INTO locations(zip, lat, lng) VALUES($1, $2, $3) RETURNING *;`;
        let values = Object.values(location);
        try {
          return client.query(sql, values)
        }
        catch (error) {
          errorHandler(error);
        }

      }
      
    })
    .catch();
}


//render map

//fetch breweries

//fetch all beers from a single brewery


module.exports = { getBeer, errorHandler};
