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






*/