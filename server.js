'use strict';

//server requirements (packages)
const express = require('express');
const superagent = require('superagent');
const methodOverride = require('method-override');
const pg = require('pg');
require('dotenv').config();

//config of server (variables)
const PORT = process.env.PORT;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => errorHandler(error));

const app = express();

app.set('view engine', 'ejs');

//middleware
app.use(express.urlencoded({extended:true}));
app.use(express.static('./public'));

app.use(methodOverride(function(req, res){
  if(req.body && typeof(req.body)=== 'object' && '_method' in req.body){
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}))

//turn on server to listen on PORT
app.listen(PORT, () => console.log(`Beerly here on PORT ${PORT}`));

//server routes
app.get('/', mainPage);
app.post('/search', getBeer);

//generic route for all incorrect access
app.use('*', (req, res) => errorHandler({status:404}, 'You have reached a page that does not exist.', res));

//route callback functions
function mainPage(req, res) {
  res.render('./index', {pageTitle: 'Beerly GF'});
}

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

//getting the beer data from the database or the API
function getBeer (request, response) {
  // const selectSQL = `SELECT * FROM beers WHERE search_query=$1;`;
  // const values = [request.query.data];

  // client.query(selectSQL, values)
  //   .then(result => {
  //     if (result.rowCount > 0) {
  //       response.send(result.rows[0]);
  //     } else {
        const apiURL = `https://sandbox-api.brewerydb.com/v2/search?q=${request.body.findBeer}&type=beer&withBreweries=y&withIngredients=y&key=`;

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
  this.time_stamp = Date.now();
}
