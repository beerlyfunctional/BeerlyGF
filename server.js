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
app.get('/', helloWorld);

//generic route for all incorrect access
app.use('*', (req, res) => errorHandler({status:404}, 'You have reached a page that does not exist.', res));

//route callback functions
function helloWorld(req, res) {
  res.send('Hello World');
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
