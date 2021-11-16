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

//express is the framework we're going to use to handle requests
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const weatherChecker = require('../utilities').weatherChecker;
let createCurrentWeather = weatherChecker.createCurrentWeather;
let createHourlyWeather = weatherChecker.createHourlyWeather;
let createDailyWeather = weatherChecker.createDailyWeather;

// constants to create API's URL to retrieve weather data
const url = 'https://api.openweathermap.org/data/2.5/onecall?';
// let lat = 'lat=47.245059&';
// let long = 'lon=-122.438933';
// let current = '&exclude=alerts,hourly,minutely,daily';
const apiKey = '&exclude=alerts,minutely&units=imperial&appid=243523a13ab5e84d60202e8553eba71b';

/**
 * @api {get} /weather/:zip? Request to get weather data 
 * @apiName GetWeather
 * @apiGroup Weather
 * 
 * @apiDescription Request to get current weather information for current, daily,
 * and hourly weather.
 * 
 * @apiParam {Number} zip code to look up. 
 * 
 * @apiError (404: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. Zip Code must be a number" 
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. Zip Code must be a five digits"
 * 
 * @apiUse JSONError
 */
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
      }  else if (request.params.zip.length < 5 || request.params.zip.length > 5) {
          response.status(400).send({
              message: "Malformed parameter. Zip Code must be a five digits"
          })
      } else {
          next()
      }
  }, (request, response, next) => {

      // There should be code for implementation zip code to latitude/longitude conversion
      let zip = request.params.zip;
      let lat = 'lat=47.245059&';
      let long = 'lon=-122.438933';
      
      const userLocation = (theUrl, thelat, theLong, theApiKey) => {
          let newUrl = theUrl + thelat + theLong + theApiKey;
          return newUrl;
      };	
	
      //compose the weather URL form different parts
      const apiUrl = userLocation(url, lat, long, apiKey);

      // fetch a weather data from given url address
      fetch(apiUrl, {
        method: 'POST',
        body: 'a=1'
      }) 
            .then(response => response.json())
            .then(data => {
                // assign the weather data to request.body
                request.body.data = data;
                next();
 
            }).catch(error => {
              response.status(400).send({
                  message: "API Error",
                  error: error
              })
            })
}, createCurrentWeather, createHourlyWeather, createDailyWeather, (request, response) => {

    // returns needed weather data as three objects:
    //    request.body.currentData,
    //    request.body.hourData, 
    //    request.body.dailyData
    response.status(201).send({
        success: true,
        currentData: request.body.currentData,
        hourData: request.body.hourData,
        dailyData: request.body.dailyData
    });

});


module.exports = router;