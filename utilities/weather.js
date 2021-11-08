const express = require('express');
const pool = require('./sql_conn.js');
const router = express.Router();

let apiKey = '243523a13ab5e84d60202e8553eba71b';
let city = 'tacoma';
let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`


request(url, function (err, response, body) {
    if(err){
      console.log('error:', error);
    } else {
      let weather = JSON.parse(body)
      let message = `It's ${weather.main.temp} degrees in ${weather.name}!`;
      console.log(message);
    }
  });