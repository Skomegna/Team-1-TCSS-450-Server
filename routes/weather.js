/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Weather the weather/endpoints including
 *      - weather/ (GET)  
 *        - curent weather
 *        - daily weather
 *        - hourly weather
 */

const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;

// http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}

/**
 * request should be in form:
 * ?zip
 */
// messages.js is a good example...
router.get("/:zip?", (request, response, next) => { 
        //validate chatId is not empty or non-number
        if (request.params.zip === undefined) {
          response.status(400).send({
              message: "Missing required information"
          })
      }  else if (isNaN(request.params.zip)) {
          response.status(400).send({
              message: "Malformed parameter. Zip Code must be a number"
          })
      }  else if (request.params.zip < 5 ) { // || request.params.zip > 5
          response.status(400).send({
              message: "Malformed parameter. Zip Code must be a five digits"
          })
      } else {
          next()
      }
  }, (request, response) => {

      let zip = request.params.zip;
      let url = 'https://api.openweathermap.org/data/2.5/onecall?';
      let lat = 'lat=47.245059&';
      let long = 'lon=-122.438933';
      let current = '&exclude=alerts,hourly,minutely,daily';
      let apiKey = '&units=imperial&appid=243523a13ab5e84d60202e8553eba71b';
      
      const userLocation = (theUrl, thelat, theLong, theCurrent, theApiKey) => {
          let newUrl = theUrl + thelat + theLong + theCurrent + theApiKey;
          return newUrl;
      };	
	
      const apiUrl = userLocation(url, lat, long, current, apiKey);


      fetch(apiUrl, {
        method: 'POST',
        body: 'a=1'
      }) 
            .then(response => response.json())
            .then(data => {
                response.send({ data });
            }).catch(error => {
              response.status(400).send({
                  message: "API Error",
                  error: error
              })
            })

});


module.exports = router;