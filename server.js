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
app.post('/search-results', getBeer);

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
  const selectSQL = `SELECT * FROM beers WHERE search_query=$1;`;
  const values = [request.query.data];

  client.query(selectSQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        response.send(result.rows[0]);
      } else {
        const apiURL = `https://sandbox-api.brewerydb.com/v2/beer/random?key=${process.env.API_KEY}`;

        superagent.get (apiURL)
          .then(apiData => {
            if (!apiData.body.data.length) {
              throw 'No Beer information available for your search criteria. Try another beer name or style. Bottoms up!';
            } else {
              let beer = new Beer (apiData.body.data[0], request.query);
              let insertSQL = `INSERT INTO beers (name, beer_id, abv, style_name, style_id, time_stamp) VALUES ($1, $2, $3, $4, $5, $6);`;
              let newValues = Object.values(beer);
              client.query(insertSQL, newValues)
                .then(sqlReturn => {
                  beer.id = sqlReturn.rows[0].id;
                  response.send(beer);
                });
            }
          });
      }
    })
    .catch(error => errorHandler (error));
}

//Coonstructor Function for beer
function Beer(data) {
  this.name = body.data.name;
  this.beer_id = body.data.id;
  this.abv = body.data.abv;
  this.style_name = body.data.style.name;
  this.style_id = body.data.style.id;
  this.time_stamp = Date.now();
}




