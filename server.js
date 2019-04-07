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
app.listen(PORT, () => console.log(`\n\n**#############\n\nBeerly here on PORT ${PORT}\n\n######################**\n\n`));

//server routes
app.get('/', mainPage);
app.post('/search', helpers.search); // search route, takes a location string in the request.body.and displays the map page
app.get('/breweries/:brewery_id', helpers.breweries); // displays a specific brewery's details and beers available.
app.get('/beers/:beer_id', helpers.beers); // displays a specific beer's details
app.post('/reviews/:beer_id', helpers.review); // adds a review for a given beer_id
app.delete('/reviews/:review_id/:beer_id', helpers.removeReview); // deletes the specified review and redirects to the given beer_id page
app.get('/location', helpers.getLocation); // get a location from Google's geocode API and sends it back
app.get('/breweries', helpers.getBreweries); // get a list of breweries for a location, needs location string, send as request.query.search_query
app.get('/about', (request, response) => response.render('about'))

//generic route for all incorrect access
app.use('*', (req, res) => helpers.errorHandler({status: 404, line: 45, server: true}, 'You have reached a page that does not exist.', res));

//route callback functions
function mainPage(req, res) {
  res.render('./index', {pageTitle: 'Beerly GF'});
}

