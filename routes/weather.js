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
 * request should be in form:
 * /:zip
 */
/**
 * @api {get} /messages/:chatId?/:messageId? Request to get chat messages 
 * @apiName GetMessages
 * @apiGroup Messages
 * 
 * @apiDescription Request to get the 10 most recent chat messages
 * from the server in a given chat - chatId. If an optional messageId is provided,
 * return the 10 messages in the chat prior to (and not including) the message containing
 * MessageID.
 * 
 * @apiParam {Number} chatId the chat to look up. 
 * @apiParam {Number} messageId (Optional) return the 15 messages prior to this message
 * 
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} messages List of massages in the message table
 * @apiSuccess {String} messages.messageId The id for this message
 * @apiSuccess {String} messages.email The email of the user who posted this message
 * @apiSuccess {String} messages.message The message text
 * @apiSuccess {String} messages.timestamp The timestamp of when this message was posted
 * 
 * @apiError (404: Missing required information) {String} message "Chat ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
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