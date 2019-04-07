require('dotenv').config();

// location gets used in multiple places, so needs to be a global for now.
// Preferably it should get passed around inside functions, but this is adequate.
var location = {};

//Requiring Superagent and our Constructor file
const superagent = require('superagent');
const constructor = require('./constructor.js');

//Connecting the Client to the Database

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => errorHandler(error));

//Helper Functions

/**
 * Error Handler
 * @param {object} error
 * @param {string} messsage Friendly error description
 * @param {object} res Express.js response
**/
function errorHandler(error, message, res) {
  console.error(error);
  if (message) {
    if (res) {
      res.send(message);
    }
    console.log(message);
  }
}

/**
 * Search function - the heavy lifter
 * @param {object} request Express.js request
 * @param {object} response Express.js response
 * @param {string} request.body.query the location string to be passed into the geocode API.
 * @request POST method
 */
function search(request, response) {

  // First make sure we have a styles table. If not, update it.
  updateStylesTable();

  // If this route is hit without going through the search field on the main page, redirect to the main page
  if (!request.body || !request.body.query) response.redirect('/');

  let city = request.body.query.toLowerCase();
  console.log(city);
  let values = [city];
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;
  let breweries;

  // check database to see if data is in DB
  client.query(sql, values)
    .then(locationResult => {

      // If we get a location back from the database, use the first one and query breweries.
      if (locationResult.rowCount > 0) {

        location = locationResult.rows[0];
        let sql = `SELECT * FROM breweries WHERE location_id = $1;`;
        let values = [location.id];

        // return the Promise created by the brewery query, which will become a brewery list result.
        return client.query(sql, values);

      } else {
        // We have no location like this in our database, so go query Google, get a new location, and then query BreweryDB
        // for breweries.
        // This could maybe be improved by saving locations as lat-long pairs with greatly reduced resolution
        let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}&address=${city}`;
        return superagent.get(url).then(data => {

          if (!data.body.results.length) {
            // If Google sends back no data, that's a problem, but nothing we can do anything about.
            errorHandler({ status: 404, line: 100 }, 'Google API not returning any data. It may be down, try again later.', response);
            throw 'Where are we??? Nothing back from GeoCodeAPI';
          } else {

            // process the location data Google sends back
            location = new constructor.Location(data.body.results[0].geometry.location, city);
            console.log(city);

            // Insert into the database and get the entire record back -- we'll need the ID later
            let sql = `INSERT INTO locations(search_query, lat, long) VALUES($1, $2, $3) RETURNING *;`;
            let values = Object.values(location);

            return client.query(sql, values);
          }
        }).then(locationResult => {

          location = locationResult.rows[0];
          // with location object, query for breweries

          let sql = `SELECT * FROM breweries WHERE location_id=$1;`;
          let values = [location.id];
          console.log(`sql ${sql}\n\n\nvalues${values}`);
          // returning Promise created by brewery query, which will become breweryResults
          return client.query(sql, values);
        });
      } // end if-else for having to get a location from the geocode API
    })
    .then(breweryResults => {

      if (breweryResults.rowCount !== 0) {

        breweries = breweryResults.rows;
        sendBreweriesToMap(breweries, location, response);

      } else { // get breweries from API

        const url = `https://api.brewerydb.com/v2/search/geo/point?lat=${location.lat}&lng=${location.long}&key=${process.env.BREWERYDB_API_KEY}&radius=20`;
        superagent.get(url).then(breweryResults => {

          if (!breweryResults.body.data) {
            errorHandler({ status: 404, line: 143 }, 'No data from BreweryDB. There may be no known breweries in this area. Send us an email!', response);
          } else {
            breweries = breweryResults.body.data.map(breweryData => {

              let brewery = new constructor.Brewery(breweryData);
              brewery.location_id = location.id;

              let sql = `INSERT INTO breweries(id, brewery, website, image, lat, long, time_stamp, location_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING;`;
              let values = Object.values(brewery);

              client.query(sql, values)
                .catch(errorHandler);
              return brewery;

            });
          }

          sql = `SELECT * FROM breweries WHERE location_id=$1;`;
          values = [location.id];

          client.query(sql, values).then(breweryQueryResult => {
            // this is where the brewery gets returned for the map front end
            sendBreweriesToMap(breweryQueryResult.rows, location, response);

          }).catch(errorHandler);

        }).catch(errorHandler);
      } // end if-else for getting breweries from API
    }).catch(errorHandler);
}

//render map function
/**
 * @param {array} breweries An aray of brewery objects
 * @param {object} location A location object
 * @param {object} response Express.js response object
 * This function takes an array of breweries, a location, and an express.js response and renders the results map.
 */
function sendBreweriesToMap(breweries, location, response) {
  response.render('search', { location: location, breweries: breweries });
}

/**
 * @param {object} request Express.js request
 * @param {object} response Express.js response
 * This is the front-end function which executes just before the map renders. It is only called from the front-end
 * and only after the above sendBreweriesToMap function is executed.
 */
function getBreweries(request, response) {

  let sql = `SELECT * FROM breweries WHERE location_id=$1;`;
  let values = [location.id];
  client.query(sql, values).then(breweriesResult => {
    response.send({ breweries: breweriesResult.rows, location: location });
  })
    .catch(errorHandler);
}

/**
 * updates the styles table from BreweryDB if we don't have styles in the database.
 */
function updateStylesTable() {

  let sql = `SELECT * FROM styles;`;
  let url = `https://api.brewerydb.com/v2/styles/?key=${process.env.BREWERYDB_API_KEY}`;

  try {
    client.query(sql).then(stylesResult => {

      if (stylesResult.rowCount) return null;
      else return superagent.get(url);

    }).then(apiStylesResult => {
      if (!apiStylesResult) return null;
      apiStylesResult.body.data.forEach(style => {

        let thisStyle = new constructor.Style(style);

        let sql = `INSERT INTO styles(id, name, description, abvmin, abvmax, ibumin, ibumax, time_stamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING;`;
        let values = Object.values(thisStyle);

        client.query(sql, values)
          .catch(errorHandler);
      });
    }).catch(errorHandler);
  }
  catch (error) {
    errorHandler(error);
  }
}

/**
 * Callback for /brewery/:brewery_id route
 * @param {object} request Express.js request
 * @param {object} response Express.js response
 * @param {string} request.params.brewery_id the id used to select a specific brewery
 */
function breweries(request, response) {
  let brewery_id = request.params.brewery_id;
  let sql = `SELECT breweries.id breweryid, breweries.brewery breweryname, breweries.website website, breweries.image breweryimage, beers.beer_id beerid, beers.name beername, beers.abv beerabv, styles.name stylename
  FROM breweries
  INNER JOIN beers ON beers.brewery_id = breweries.id
  INNER JOIN styles ON beers.style_id = styles.id
  WHERE breweries.id=$1;`;

  // query the database for the following information: breweryid, breweryname, website, breweryimage, beerid, beername, beerabv, stylename
  client.query(sql, [brewery_id]).then(breweryResult => {

    // This query only returns rows if there are beers for a brewery.
    if (breweryResult.rowCount === 0) {
      console.log(`Getting beers for this brewery from BreweryDB`);
      return beersByBreweryFromApi(brewery_id);
    } else {
      response.render('pages/breweryDetails', { breweryBeers: breweryResult.rows });
    }

  }).then(beersFromApi => {
    console.log('beer data back from API');
    // if there are no beers for this brewery, so create a special "this beer doesn't exist" beer for the database
    if (!beersFromApi.body.data) {
      beersFromApi.body.data = [{
        name: 'no beers available',
        id: `${brewery_id}none`,
        abv: 0,
        ibu: 0,
        time_stamp: Date.now(),
        style: { id: 1 },
        breweries: [{ id: brewery_id }]
      }];
    }

    // Take beer data, process it, insert into database, and redirect to the brewery page to pull data again.
    beersFromApi.body.data.forEach(element => {

      let beer = new constructor.Beer(element);

      let sql = `INSERT INTO beers(name, beer_id, abv, ibu, time_stamp, style_id, brewery_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING;`;
      let values = Object.values(beer);

      client.query(sql, values)
        .catch(errorHandler);
    });
    response.redirect(`/breweries/${brewery_id}`);

  }).catch(errorHandler);
}

/**
 * @param {string} brewery_id id of the brewery you want the beers from
 * @returns {Promise} Promise object which represents a superagent.get call to the BreweryDB API
 */
function beersByBreweryFromApi(brewery_id) {
  console.log('getting beer list from api for brewery_id ', brewery_id);
  let url = `https://api.brewerydb.com/v2/brewery/${brewery_id}/beers?withBreweries=Y&key=${process.env.BREWERYDB_API_KEY}`;
  console.log(url);
  return superagent.get(url);
}

/**
 * @param {object} request Express.js request
 * @param {object} response Express.js response
 * @param {string} request.params.beer_id ID of the beer you want to get details about
 * @request GET method
 * fetch a single beer's details from the database and send it to the front end.
 * */
function beers(request, response) {

  let beer, reviewsArray;

  let sql = `SELECT breweries.brewery breweryname, breweries.website website, breweries.image image, beers.beer_id beerid, beers.name beername, beers.abv beerabv, beers.ibu beeribu, styles.name stylename, styles.description styledesc, styles.abvmin abvmin, styles.abvmax abvmax, styles.ibumin ibumin, styles.ibumax ibumax
  FROM beers
  INNER JOIN breweries ON beers.brewery_id = breweries.id
  INNER JOIN styles ON beers.style_id = styles.id
  WHERE beers.beer_id=$1;`;

  client.query(sql, [request.params.beer_id])
    .then(beerResult => {
      if (beerResult.rowCount === 0) throw 'NO INFO IN DB';

      beer = beerResult.rows[0];
      sql = `SELECT * FROM reviews WHERE beer_id=$1;`;
      return client.query(sql, [beer.beerid]);
    })
    .then(reviewsResult => {

      if (reviewsResult.rowCount === 0) reviewsArray = [];
      else reviewsArray = reviewsResult.rows;

      response.render('pages/beerdetails', { beer: beer, reviews: reviewsArray });
    }).catch(errorHandler);
}

/**
 * Callback function for the /reviews/:beer_id route
 * Used to insert a review into the database, then redirect the user back to the beer.
 * @param {object} request Express.js request
 * @param {object} response Express.js response
 * @param {string} request.params.beer_id ID of the beer you want to add a review for
 * @request POST method
 */
function review(request, response) {

  let review = new constructor.Review(request.body);

  let sql = `INSERT INTO reviews(beer_id, note, rating, time_stamp, gf) VALUES($1, $2, $3, $4, $5) RETURNING id;`;
  let values = Object.values(review);

  client.query(sql, values)
    .then(result => {
      console.log(result.rows[0].id);
      response.redirect(`/beers/${request.params.beer_id}`);
    })
    .catch(errorHandler);
}

/**
 * Callback function for the /reviews/:review_id/:beer_id route
 * Used to delete a review and redirect the user back to a beer
 * @param {object} request Express.js request
 * @param {object} response Express.js response
 * @param {string} request.params.review_id Review ID to delete from the database
 * @param {string} request.params.beer_id Beer ID to redirect the user back to
 */
function removeReview(request, response) {
  let sql = `DELETE FROM reviews WHERE id=$1`;
  let values = [request.params.review_id];

  client.query(sql, values)
    .then(response.redirect(`/beers/${request.params.beer_id}`))
    .catch(errorHandler);
}


module.exports = { search, errorHandler, breweries, beers, review, removeReview, getBreweries };
