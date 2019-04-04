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
  if (message) {
    console.log('Error message:', message);
    if (res) {
      res.send(message);
    }
  }
}

// Search function
function search(request, response) {
  // check database to see if data is in DB
  let city = request.body.query;
  let values = [city];
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;

  let location;
  let breweries;
  client
    .query(sql, values)
    .then(locationResult => {

      if (locationResult.rowCount > 0) {
        //transfer control over to map function -> which will do the rendering
        console.log('info from db w/o api call', locationResult.rows);
        location = locationResult.rows[0];

        let sql = `SELECT * FROM breweries WHERE location_id = $1;`;
        let values = [location.id];

        client
          .query(sql, values)
          .then(breweryResults => {

            if (breweryResults.rowCount > 0) {

              breweries = breweryResults.rows;
              console.log(breweries, 'breweries from DB 🐨');
              response.send(location);

            } else { // get breweries from API

              const url = `https://sandbox-api.brewerydb.com/v2/search/geo/point?lat=${location.lat}&lng=${location.long}&key=${process.env.BREWERYDB_API_KEY}&radius=20`;

              superagent.get(url)
                .then(breweryResults => {
                  if (!breweryResults.body.data) {
                    errorHandler({ status: 404 }, 'No data from brewerydb', response);
                  }
                  breweries = breweryResults.body.data.map(breweryData => {
                    let brewery = new constructor.Brewery(breweryData);

                    let sql = `INSERT INTO breweries(id, brewery, website, image, lat, long, time_stamp) VALUES($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING;`;
                    let values = Object.values(brewery);

                    client.query(sql, values)
                      .catch(error => errorHandler(error));
                    console.log(`brewery ${brewery.id} added to db`);

                    sql = `SELECT * FROM breweries WHERE id=$1;`;
                    values = Object.values(brewery.id);
                    client.query(sql, values)
                      .then(breweryQueryResult => {
                        // this is where the brewery gets returned for the map method
                        return breweryQueryResult.rows[0];
                      })
                      .catch(error => errorHandler(error));
                  });
                  response.send(location);
                })
                .catch(error => errorHandler(error));
            }
          })
          .catch(error => errorHandler(error));

      } else {
        console.log('No SQL result, going to geocode API');
        const url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}&address=${city}`;

        superagent
          .get(url)
          .then(data => {

            console.log('🗺 from the googs');
            if (!data.body.results.length) {
              errorHandler({ status: 404 }, 'Google API not returning any data. Please check your input', response);
              throw 'Where are we??? Nothing back from GeoCodeAPI';
            } else {

              location = new constructor.Location(data.body.results[0].geometry.location, city);

              let sql = `INSERT INTO locations(search_query, lat, long) VALUES($1, $2, $3) RETURNING *;`;
              let values = Object.values(location);
              client
                .query(sql, values)
                .then(locationResult => {
                  location = locationResult.rows[0];
                  // with location object, query for breweries

                  let sql = `SELECT * FROM breweries WHERE location_id = $1;`;
                  let values = [location.id];

                  client
                    .query(sql, values)
                    .then(breweryResults => {

                      if (breweryResults.rowCount > 0) {

                        breweries = breweryResults.rows;
                        console.log(breweries, 'breweries from DB 🐨');
                        response.send(location);

                      } else { // get breweries from API

                        const url = `https://sandbox-api.brewerydb.com/v2/search/geo/point?lat=${location.lat}&lng=${location.long}&key=${process.env.BREWERYDB_API_KEY}&radius=20`;

                        superagent.get(url)
                          .then(breweryResults => {
                            if (!breweryResults.body.data) {
                              errorHandler({ status: 404 }, 'No data from brewerydb', response);
                            }
                            breweries = breweryResults.body.data.map(breweryData => {
                              let brewery = new constructor.Brewery(breweryData);

                              let sql = `INSERT INTO breweries(id, brewery, website, image, lat, long, time_stamp) VALUES($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING;`;
                              let values = Object.values(brewery);

                              client.query(sql, values)
                                .catch(error => errorHandler(error));
                              console.log(`brewery ${brewery.id} added to db`);

                              sql = `SELECT * FROM breweries WHERE id=$1;`;
                              values = Object.values(brewery.id);
                              client.query(sql, values)
                                .then(breweryQueryResult => {
                                  // this is where the brewery gets returned for the map method
                                  return breweryQueryResult.rows[0];
                                })
                                .catch(error => errorHandler(error));
                            });
                            // THis is where the data gets sent back tothe front end. IT might work elsewhere, but this works for now.
                            response.send(location);
                          })
                          .catch(error => errorHandler(error));
                      }
                    })
                    .catch(error => errorHandler(error));
                  //
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

//fetch breweries and their beer list
function breweries(request, response) {
  let sql = `SELECT * FROM breweries WHERE id=$1;`;
  let beersql = `SELECT * FROM beers WHERE brewery_id=$1;`;

  client.query(sql, [request.params.brewery_id]).then(breweryResult => {
    client.query(beersql, [request.params.brewery_id]).then(beerResult => {
      if (breweryResult.rows.length < 1) {
        return response.render('./pages/error.ejs', { message: 'I am so sorry, this brewery was not found.' })
      }
      return response.render('./MKCbreweries.ejs', { brewery: breweryResult.rows[0], beers: beerResult.rows });
    }).catch(error => errorHandler(error));
  }).catch(error => errorHandler(error));
}

//fetch a single beer's details
function beers(request, response) {
  let sql = `SELECT * FROM beers WHERE id=$1;`;

  client.query(sql[request.params.beer_id]).then(beer => {
    return response.render('./PlaceHolderPage.ejs', { beer: beer.rows });
  }).catch(error => errorHandler(error));
}

//database seeding

function seed(req, res) {
  let location;
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;
  let values = ['seattle'];
  client
    .query(sql, values)
    .then(result => {
      if (!result.rowCount) throw 'All broken, stop now';
      console.log('result found');
      location = result.rows[0];

      const brewerySeed = require('./data/breweries-seattle.json').data;
      const breweryArray = brewerySeed
        .filter(brewery => brewery.openToPublic === 'Y')
        .map(element => {
          let brewery = new constructor.Brewery(element);
          brewery.location_id = location.id;
          let sql = `INSERT INTO breweries(id, brewery, website, image, lat, long, time_stamp, location_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING;`;
          let values = Object.values(brewery);
          client.query(sql, values)
            .catch(error => errorHandler(error));
          console.log('🍺 Insert Complete');
          return brewery;
        });

      const styles = require('./data/styles.json').data;
      const styleArray = styles.map(style => {
        let thisStyle = new constructor.Style(style);
        let sql = `INSERT INTO styles(id, name, description, abvmin, abvmax, ibumin, ibumax, time_stamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING;`;
        let values = Object.values(thisStyle);
        client.query(sql, values)
          .catch(error => errorHandler(error));
        console.log('Style Insert Complete');
        return thisStyle;
      });

      const beerSeed = require('./data/ale.json').data;
      const beerArray = beerSeed.map(element => {
        let beer = new constructor.Beer(element);
        let sql = `INSERT INTO beers(name, beer_id, abv, ibu, time_stamp, style_id, brewery_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING;`;
        let values = Object.values(beer);
        console.log(beer.brewery_id);
        client.query(sql, values)
          .catch(error => errorHandler(error));
        console.log('🍺 Insert Complete', beer);
        return beer;
      });
      res.render('pages/datadisplay', { breweries: breweryArray, styles: styleArray, beers: beerArray });
    })
    .catch(error => errorHandler(error));

}
module.exports = { search, errorHandler, breweries, beers, seed };
