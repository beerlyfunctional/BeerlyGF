require('dotenv').config();
var location = {};

//Requireing Superagent and our Constructor file
const superagent = require('superagent');
const constructor = require('./constructor.js');

//Connecting the Client to the Database

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => errorHandler(error));

//Helper Functions

//Error Handler
function errorHandler(error, message, res) {
  console.error(error);
  if (message) {
  
    if (res) {
      res.send(message);
    }
  }
}

// Search function
function search(request, response) {
  
  // check database to see if data is in DB
  let city = request.body.query;
  console.log(city);
  let values = [city];
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;


  let breweries;
  client
    .query(sql, values)
    .then(locationResult => {

      if (locationResult.rowCount > 0) {
        //transfer control over to map function -> which will do the rendering
        location = locationResult.rows[0];
  

        let sql = `SELECT * FROM breweries WHERE location_id = $1;`;
        let values = [location.id];

        client.query(sql, values)
          .then(breweryResults => {

            if (breweryResults.rowCount > 0) {

             
              getBreweriesWeWantToRender(breweryResults.rows, response);

            } else { // get breweries from API

              let url = `https://api.brewerydb.com/v2/search/geo/point?lat=${location.lat}&lng=${location.long}&key=${process.env.BREWERYDB_API_KEY}&radius=20`;
            
              superagent.get(url)
                .then(breweryResults => {
               
                  if (!breweryResults.body.data) {
                    return errorHandler({ status: 404, line: 64 }, 'No data from brewerydb', response);
                  }
                  breweries = breweryResults.body.data.map(breweryData => {
                    let brewery = new constructor.Brewery(breweryData);

                    let sql = `INSERT INTO breweries(id, brewery, website, image, lat, long, time_stamp) VALUES($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING;`;
                    let values = Object.values(brewery);
                

                    client.query(sql, values)
                      .catch(error => errorHandler(error));

                    sql = `SELECT * FROM breweries WHERE id=$1;`;
                    values = [brewery.id];
                    client.query(sql, values)
                      .then(breweryQueryResult => {
                        console.log(breweryQueryResult.rowCount, `🙈`)
                        // this is where the brewery gets returned for the map method
                        getBreweriesWeWantToRender(breweryQueryResult.rows, response);
                      })
                      .catch(error => {errorHandler(error)})
                  });

                })
                .catch(error => errorHandler(error));
            }
          })
          .catch(error => errorHandler(error));

      } else {
        let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}&address=${city}`;
        superagent
          .get(url)
          .then(data => {
            if (!data.body.results.length) {
              errorHandler({ status: 404, line: 100 }, 'Google API not returning any data. Please check your input', response);
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

                  let sql = `SELECT * FROM breweries WHERE location_id=$1;`;
                  let values = [location.id];
                  client
                    .query(sql, values)
                    .then(breweryResults => {

                      if (breweryResults.rowCount > 0) {

                        breweries = breweryResults.rows;
                        getBreweriesWeWantToRender(breweries, response);

                      } else { // get breweries from API

                        const url = `https://api.brewerydb.com/v2/search/geo/point?lat=${location.lat}&lng=${location.long}&key=${process.env.BREWERYDB_API_KEY}&radius=20`;
                        superagent.get(url)
                          .then(breweryResults => {
                            if (!breweryResults.body.data) {
                              errorHandler({status: 404, line: 133}, 'No data from brewerydb', response);
                            }
                            breweries = breweryResults.body.data.map(breweryData => {
                              let brewery = new constructor.Brewery(breweryData);
                              brewery.location_id = location.id;
                              let sql = `INSERT INTO breweries(id, brewery, website, image, lat, long, time_stamp, location_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING;`;
                              let values = Object.values(brewery);

                              client.query(sql, values)
                                .catch(error => errorHandler(error));

                              console.log(`brewery ${brewery.id} added to db`);

                            });
                            sql = `SELECT * FROM breweries WHERE location_id=$1;`;
                            values = [location.id];
                            client.query(sql, values)
                              .then(breweryQueryResult => {
                                // this is where the brewery gets returned for the map method
                                getBreweriesWeWantToRender(breweryQueryResult, response)
                                // console.log(breweryQueryResult);
                              })
                              .catch(error => errorHandler(error));
                            // THis is where the data gets sent back to the front end. IT might work elsewhere, but this works for now.
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
function getBreweriesWeWantToRender(breweries, response) {
  //every brewery on the map needs to have beers avaliable
  // let breweryArray = [];
  // console.log('heree')
  // breweries.rows.forEach(brewery => {
  //   let url = `https://api.brewerydb.com/v2/brewery/${brewery.id}/beers?key=${BREWERYDB_API_KEY};`
  //   superagent.get(url)
  //     .then( beers => {
  //       if(beers.body.data){
  //         breweryArray.push(brewery);
  //       }
  //     }).catch(error => errorHandler(error))
  //   // breweryArray.push(brewery);
  // })
  // console.log('++++++')
  // console.log(breweryArray)
  console.log('-------')
  // console.log(breweries)
  console.log(location)
  // return getBreweries(location, breweries)
  response.render('search', {location:location, breweries: breweries});
}
//

//fetch breweries and their beer list
function breweries(request, response) {
  let sql = `SELECT breweries.id breweryid, breweries.brewery breweryname, breweries.website website, breweries.image breweryimage, beers.beer_id beerid, beers.name beername, beers.abv beerabv, styles.name stylename
  FROM breweries
  INNER JOIN beers ON beers.brewery_id = breweries.id
  INNER JOIN styles ON beers.style_id = styles.id
  WHERE breweries.id=$1;`;

  client.query(sql, [request.params.brewery_id]).then(breweryResult => {
    if (breweryResult.rowCount === 0) console.log('\n\n\nNO DATA FROM DB, BIG PROBLEMS\n\n\n');
    console.log('line204');
    response.render('pages/breweryDetails', {breweryBeers: breweryResult.rows});
  })
    .catch(errorHandler);
}

//fetch a single beer's details
function beers(request, response) {
  // let sql = `SELECT * FROM beers WHERE id=$1;`;
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
      // console.log(`${beer}\n\n\n ${reviewsArray}`);
      console.log(reviewsResult.rows[0], request.params.beer_id);
      response.render('pages/beerdetails', {beer: beer, reviews: reviewsArray});
    })
    .catch(error => errorHandler(error));
}

//update a beer entry w/ a comment

function review(request, response){
  // let {beer_id, note, rating, time_stamp, gf} = request.body;
  console.log(request.body);

  let review = new constructor.Review(request.body);

  let sql = `INSERT INTO reviews(beer_id, note, rating, time_stamp, gf) VALUES($1, $2, $3, $4, $5) RETURNING id;`;
  let values = Object.values(review);
  console.log(values);
  console.log(review);

  client.query(sql, values)
    .then(result => {
      console.log(result.rows[0].id);
      response.redirect(`/beers/${request.params.beer_id}`);
    })
    .catch(error => errorHandler(error));
}

//delete a comment

function removeReview(request, response){
  let sql = `DELETE FROM reviews WHERE id=$1`;
  let values = [request.params.review_id];
  console.log(request.body);

  client.query(sql, values)
    .then(response.redirect(`/beers/${request.params.beer_id}`))
    .catch(errorHandler);

}

//render shelf

function shelf(request, response){
  let sql = //join function

client.query(sql [request.params.beer_id]).then(shelfResult =>{
  if(shelfResult.rows.length > 0){
    return response.render(`./shelf`, {shelf: shelfResult.rows});
  }
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
            .catch(errorHandler);
          //.log('🍺 Insert Complete');
          return brewery;
        });

      const styles = require('./data/styles.json').data;
      const styleArray = styles.map(style => {

        let thisStyle = new constructor.Style(style);

        let sql = `INSERT INTO styles(id, name, description, abvmin, abvmax, ibumin, ibumax, time_stamp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING;`;
        let values = Object.values(thisStyle);

        client.query(sql, values)
          .catch(errorHandler);
        //console.log('Style Insert Complete');
        return thisStyle;
      });

      let beerSeed, beerArray;
      breweryArray.forEach(brewery => {

        beerSeed = require(`./data/${brewery.id}.json`).data;
        beerArray = beerSeed.map(element => {

          let beer = new constructor.Beer(element);

          let sql = `INSERT INTO beers(name, beer_id, abv, ibu, time_stamp, style_id, brewery_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING;`;
          let values = Object.values(beer);
          
          client.query(sql, values)
            .catch(errorHandler);
          return beer;
        });
      });
      res.render('pages/datadisplay', { breweries: breweryArray, styles: styleArray, beers: beerArray });
    })
    .catch(errorHandler);

}

function getLocation(request, response) {
  let search_query = request.query.search_query;
  search_query='seattle';
  let sql = `SELECT * FROM locations WHERE search_query=$1;`;
  let values = [search_query];

  client
    .query(sql, values)
    .then(result => {
      if (result.rowCount === 0){
        let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}&address=${city}`;
        console.log(url)
        // return next async call to promise chain
        return superagent.get(url);
      } else {
        response.send(result.rows[0]);
      }
    })
    .then(data => {
      // console.log('🗺 from the googs');
      if (!data.body.results.length) {
        errorHandler({ status: 404, line: 100 }, 'Google API not returning any data. Please check your input', response);
        throw 'Where are we??? Nothing back from GeoCodeAPI';
      } else {

        location = new constructor.Location(data.body.results[0].geometry.location, city);

        let sql = `INSERT INTO locations(search_query, lat, long) VALUES($1, $2, $3) RETURNING *;`;
        let values = Object.values(location);
        return client.query(sql, values);
      }})
    .then(locationResult => {
      location = locationResult.rows[0];
      response.send(location);
    })
    .catch(errorHandler);
}

function getBreweries (request, response) {
  // let location = request.query.location;
  // console.log('+_+_+_+_+')
  console.log(location)
  // console.log(request.query)
  console.log(location.id)
  location=location.id;

  let sql = `SELECT * FROM breweries WHERE location_id=$1;`;
  let values = [location];
  client.query(sql, values)
    .then(breweriesResult => {
      console.log(breweriesResult)
      if (breweriesResult.rowCount === 0) {
        // TODO: get data from api
      }
      else {
        response.send(breweriesResult.rows);
      }
    })
    .catch(error => errorHandler(error));
}

function getBeers (request, response) {

}

function getStyles (request, response) {

}

module.exports = {search, errorHandler, breweries, beers, seed, review, removeReview, shelf, getLocation, getBreweries, getBeers, getStyles};
