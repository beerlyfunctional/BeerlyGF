/*

  //getting the beer data from the database or the API

  function getBeer (request, response) {
  // const selectSQL = `SELECT * FROM beers WHERE search_query=$1;`;
  // const values = [request.query.data];

  // client.query(selectSQL, values)
  //   .then(result => {
  //     if (result.rowCount > 0) {
  //       response.send(result.rows[0]);
  //     } else {
  const apiURL = `https://sandbox-api.brewerydb.com/v2/search?q=${request.body.findBeer}&type=beer&withBreweries=y&withIngredients=y&key=${process.env.API_KEY}`;

  superagent.get(apiURL)
    .then(apiData => {
      if (!apiData.body.data.length) {
        throw 'No Beer information available for your search criteria. Try another beer name or style. Bottoms up!';
      } else {
        let beerArray = apiData.body.data.map(beerData => {
          let beer = new Beer(beerData);
          let beerValues = Object.values(beer);
          let beerSql = `INSERT INTO beers (${Object.keys(beer)}) VALUES(${beerValues.map((value,idx) => `$${idx+1}` )});`;

          client.query(beerSql, beerValues)
            .catch(error => errorHandler(error));

          let style = new Style(beerData.style);
          let styleValues = Object.values(style);
          let styleSql = `INSERT INTO styles (${Object.keys(style)}) VALUES(${styleValues.map((value,idx) => `$${idx+1}` )});`;

          client.query(styleSql, styleValues)
            .catch(error => errorHandler(error));

          let brewery = new Brewery(beerData.breweries[0]);
          let breweryValues = Object.values(brewery);
          let brewerySql = `INSERT INTO breweries (${Object.keys(brewery)}) VALUES(${breweryValues.map((value,idx) => `$${idx+1}` )});`;

          client.query(brewerySql, breweryValues)
            .catch(error => errorHandler(error));
          let returnobj = { beer: beer, style: style, brewery: brewery };
          console.log(returnobj);
          return returnobj;
        });
        // let beer = new Beer (apiData.body.data, request.query);
        // let insertSQL = `INSERT INTO beers (name, beer_id, abv, style_name, style_id, time_stamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`;
        // let newValues = Object.values(beer);
        // client.query(insertSQL, newValues)
        //   .then(sqlReturn => {
        //     beer.id = sqlReturn.rows[0].id;
        //     response.send(beer);
        //   });
      }
    });
  //   }
  // })
  // .catch(error => errorHandler (error));
}






//fetch lat long
function fetch_lat_long(city){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}&address=${city}`;
  console.log(url);
  superagent.get(url)
    .then(data => {
      console.log('🗺 from the googs');
      if(!data.body.results.length) throw 'Where are we??? Nothing back from GeoCodeAPI';

      else{
        let location = new constructor.Location(data.body.results[0].geometry.location, city);

        let sql = `INSERT INTO locations(zip, lat, lng) VALUES($1, $2, $3) RETURNING *;`;
        let values = Object.values(location);
        try {
          return client.query(sql, values);
        }
        catch (error) {
          errorHandler(error);
        }

      }

    })
    .catch(error => errorHandler(error));
}


const brewerySeed = require('./data/breweries-seattle.json').data;
        brewerySeed.filter(brewery => brewery.openToPublic === 'Y')
          .forEach(element => {
            let brewery = new constructor.Brewery(element)
            brewery.location_id = location.id;
            let sql = `INSERT INTO breweries(id, brewery, website, image, lat, long, time_stamp, location_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8);`;
            let values = Object.values(brewery);
            client.query(sql, values);
            console.log('🍺 Insert Complete', brewery);
          });

let sql = `SELECT * FROM beers WHERE brewery_id = $1;`;
              let values = [brewery_id]




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





*/
