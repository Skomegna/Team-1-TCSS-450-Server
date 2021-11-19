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
const url = 'https://api.openweathermap.org/data/2.5/onecall?lat=';
const middleUrl1 = '&lon=';
const middleUrl2 = '&exclude=alerts,minutely&units=imperial&appid=';

// URL for API to convert unix timestamp to human-readable date
const humanDateAPI = 'https://showcase.api.linx.twenty57.net/UnixTime/fromunixtimestamp?unixtimestamp=';

const apiKey = process.env.weather_API;

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
 * @apiSuccess (Success 201) {boolean} success 
 * @apiSuccess (Success 201) {Object}  currentData
 * @apiSuccess (Success 201) {Array}  hourData
 * @apiSuccess (Success 201) {Array}  dailyData
 * 
 * @apiSuccessExample {json} Response-Success-Example:
 * {
    "success": true,
    "currentData": {
        "curTemp": 47,
        "curHumidity": 71,
        "curFeels_like": 44,
        "curRain": 0,
        "ccurIcon": "01d"
    },
    "hourData": [
        {
            "hHours": 13,
            "hTemp": 47,
            "hIcon": "02d"
        },
      . . .
        {
            "hHours": 12,
            "hTemp": 43,
            "hIcon": "04d"
        }
    ],
    "dailyData": [
        {
            "dDay": "Wed",
            "dTemp": 45,
            "dIcon": "04d"
        },
        . . .
        {
            "dDay": "Tue",
            "dTemp": 47,
            "dIcon": "10d"
        }
    ]
}
 *      
 * 
 * @apiError (404: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. Zip Code must be a number" 
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. Zip Code must be a five digits"
 * 
 * @apiError (400: Invalid Response) {String} message "Malformed parameter. Human Data API Error"
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
          next();
      }
  }, (request, response, next) => {

      // There should be code for implementation zip code to latitude/longitude conversion
      let zip = request.params.zip;
      let lat = '47.245059&';   // '35.6762'; - Tokyo   ;   lat=47.245059&'  - Tacoma
      let long = '-122.438933'; // '139.6503' - Tokyo   ;   lon=-122.438933' - Tacoma
      
      const userLocation = (theUrl, thelat, theMiddleUrl1, theLong, theMiddleUrl2, theApiKey) => {
        let newUrl = theUrl + thelat + theMiddleUrl1 + theLong + theMiddleUrl2 + theApiKey;
        return newUrl;
      };	
      
      //compose the weather URL form different parts
      const apiUrl = userLocation(url, lat, middleUrl1, long, middleUrl2,  apiKey);

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
                message: "Weather API Error",
                error: error
              })
            })
}, (request, response, next) => {
    let adjustedTimeStemp = request.body.data.hourly[0].dt
        + (request.body.data.timezone_offset);

        //compose the timestamp URL with offset
        let url = humanDateAPI + adjustedTimeStemp;
    
        // fetch a timestamp to human time API to receive a human-readable date.
        fetch(url, {
            method: 'GET'
          })  
            .then(response => response.json())
            .then(data => {
                // assign the date to request.body.humanTime
                request.body.adjHumanTime = data.Datetime;
                
                next();
            }).catch(error => {
                console.log("error!");
                console.log(error);
                response.status(400).send({
                    message: "Human Data API Error",
                    error: error
                })
            });

}, (request, response, next) => {
    let timeStemp = request.body.data.hourly[0].dt;

        //compose the timestamp URL with offset
        let url = humanDateAPI + timeStemp;
    
        // fetch a timestamp to human time API to receive a human-readable date.
        fetch(url, {
            method: 'GET'
          })  
            .then(response => response.json())
            .then(data => {
                // assign the date to request.body.humanTime
                request.body.humanTime = data.Datetime;
                
                next();
            }).catch(error => {
                console.log("error!");
                console.log(error);
                response.status(400).send({
                    message: "Human Data API Error",
                    error: error
                })
            });

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
