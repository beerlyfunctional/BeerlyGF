'use strict';
require('dotenv').config();

//server requirements (packages)
const express = require('express');

const methodOverride = require('method-override');

const helpers = require('./helpers.js');

//config of server (variables)
const PORT = process.env.PORT;



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
app.post('/search', helpers.search);
app.get('/breweries/:brewery_id', helpers.breweries);
app.get('/beers/:beer_id', helpers.beers);
app.get('/seeddb', helpers.seed);
app.post('/beers/:beer_id', helpers.review);
app.delete('/beers/:beer_id/:review_id', helpers.removeReview);
app.get('/shelf/:beer_id', helpers.shelf);
app.get('/location', helpers.getLocation);
app.get('/breweries', helpers.getBreweries);
app.get('/about', (request, response) => response.render('about'))
// app.get('/beers', helpers.getBeers);
// app.get('/styles', helpers.getStyles);

//generic route for all incorrect access
app.use('*', (req, res) => helpers.errorHandler({status: 404, line: 45, server: true}, 'You have reached a page that does not exist.', res));

//route callback functions
function mainPage(req, res) {
  res.render('./index', {pageTitle: 'Beerly GF'});
}

