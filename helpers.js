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
  let city = request.body.findBeer[0];
  let values = [city];
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;
  let location;
  let breweries;
  let beer_by_brewery_array;

  client.query(sql, values)
    .then(result => {
      if (result.rowCount > 0) {
        //transfer control over to map function -> which will do the rendering
        console.log('info from db w/o api call', result.rows);
        location = result.rows[0];

      }
      else {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}&address=${city}`;
        superagent.get(url)
          .then(data => {
            console.log('🗺 from the googs');
            if(!data.body.results.length) throw 'Where are we??? Nothing back from GeoCodeAPI';

            else{
              location = new constructor.Location(data.body.results[0].geometry.location, city);

              let sql = `INSERT INTO locations(search_query, lat, long) VALUES($1, $2, $3) RETURNING *;`;
              let values = Object.values(location);
              client.query(sql, values)
                .then(locationResult => {
                  location = locationResult.rows[0];
                })
                .catch(error => errorHandler(error));
            }

          })
          .catch(error => errorHandler(error));
      }

    })
    .catch(error => errorHandler(error));

}


//render map

//fetch breweries




//fetch all beers from a single brewery


module.exports = { search, errorHandler};
