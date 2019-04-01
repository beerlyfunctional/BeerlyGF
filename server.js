'use strict';

//server requirements
const express = require('express');
const superagent = require('superagent');
const methodOverride = require('method-override');
const pg = require('pg');
require('dotenv').config();

//config of server (variables)
const PORT = process.env.PORT;

const client = new pg.Client(process.env.DATABASE_URL);

