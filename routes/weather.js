/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Weather the weather/endpoints including
 *      - weather/ (GET)  
 *        - city, region
 *        - curent weather
 *        - daily weather
 *        - hourly weather
 */

//express is the framework we're going to use to handle requests
const fetch = require('node-fetch');
const axios = require('axios');

const express = require('express');
const router = express.Router();

const weatherChecker = require('../utilities').weatherChecker;
let createCurrentWeather = weatherChecker.createCurrentWeather;
let createHourlyWeather = weatherChecker.createHourlyWeather;
let createDailyWeather = weatherChecker.createDailyWeather;
let dtToHumanDate = weatherChecker.dtToHumanDate;

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;

// constants to create API's URL to retrieve weather data
const url = 'https://api.openweathermap.org/data/2.5/onecall?lat=';
const middleUrl1 = '&lon=';
const middleUrl2 = '&exclude=alerts,minutely&units=imperial&appid=';

// URL for API to convert unix timestamp to human-readable date
const humanDateAPI = 'https://showcase.api.linx.twenty57.net/UnixTime/fromunixtimestamp?unixtimestamp=';

// URL for API to convert zip code to lat/long and retrieve city name and regeon
const locationAPIurl = 'https://geocode.xyz';

// API key for weather API
const apiKey = process.env.weather_API;

// API key for location API
const locationApiKey = process.env.location_API_Key;

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {get} /weather/:location? Request to get weather data 
 * @apiName GetWeather
 * @apiGroup Weather
 * 
 * @apiDescription Request to get current weather information for current, daily,
 * and hourly weather.
 * 
 * @apiParam {Number} location the zip code or lat/long to look up.
                       The zipcode can be hardcoded into url, lat/long 
                       should be hardcoded with a ':' between
 * 
 * @apiSuccess (Success 201) {boolean} success true if the data is given
 * @apiSuccess (Success 201) {Object}  currentData the JSON object 
                                       containing the data about the 
                                       current weather
 * @apiSuccess (Success 201) {Array}  hourData the JSON object 
                                      containing the data about the 
                                      next 24 hours
 * @apiSuccess (Success 201) {Array}  dailyData the JSON object 
                                      containing the data about the 
                                      next 7 days
 * 
 * @apiSuccessExample {json} Response-Success-Example:
 * {
    "success": true,
    "location": "Tacoma, WA",
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
* @apiError (404: Missing Parameters) {String} message
 *                                              "Missing Location params"
 *    
 * @apiError (404: Missing Parameters) {String} message
 *                                              "Missing required information"
 * 
 * @apiError (400: API error) {String} message "lat/long to city name API Error" 
 * 
 * @apiError (400: Invalid Parameter) {String} message "Malformed Location Information"
 * 
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. 
                                               Zip Code must be a five digits"
 * 
 * @apiError (400: API error) {String} message "ZIP to lat/lon API Error"
 * 
 * @apiError (400: API error) {String} message "Weather API Error"
 * 
 * @apiUse JSONError
 */
router.get("/:location?", (request, response, next) => {

    if (isStringProvided(request.params.location)) {
        next();
    } else {
        response.status(400).json({ message: 'Missing Location params' });
    };
}, (request, response, next) => {

    // If passed lat/long, it lat and long, and retrive city information
    if (isNaN(request.params.location)) {

        const [lat, long] = request.params.location.split(':');

        // Checking if lat and long existing and integers
        if (isStringProvided(lat) && isStringProvided(long)
            && !isNaN(lat) && !isNaN(long)) {

            const params = {
                auth: locationApiKey,
                locate: lat + "," + long,
                json: '1'
            }

            axios.get(locationAPIurl, { params })
                .then(response => {

                    let city = response.data.city; 
                    city = city[0] + city.substring(1).toLowerCase();
                    let region = response.data.state;

                    // assigned lat, long, region, and city to request
                    request.body.coordinates = {
                        "lat": lat,
                        "long": long,
                        "region": region,
                        "city": city
                    };
                    next();

                }).catch(error => {
                    response.status(400).send({
                        message: "lat/long to city name API Error",
                        error: error
                    })
                })

        } else {
            response.status(400).send({
                message: "Malformed Location Information"
            });
        };
    } else {   
        // if passed zip code, it retreives lat, lang, city, and region
        let zipCode = request.params.location;

        // checking if zip code is exact 5 digits
        if (zipCode.length < 5 || zipCode.length > 5) {
            response.status(400).send({
                message: "Malformed parameter. Zip Code must be a five digits"
            })
        } else {

            const params = {
                auth: locationApiKey,
                locate: zipCode,
                region: 'US',
                json: '1'
            }
            axios.get(locationAPIurl, { params })
                .then(response => {
                    // assign the weather data to request.body
                    let lat = response.data.latt;
                    let long = response.data.longt;
                    let city = response.data.standard.city;
                    let region = response.data.standard.region;

                    request.body.coordinates = {
                        "lat": lat,
                        "long": long,
                        "region": region,
                        "city": city
                    };
                    next();

                }).catch(error => {
                    response.status(400).send({
                        message: "ZIP to lat/lon API Error",
                        error: error
                    })
                })
        }
    }
}, (request, response, next) => {

    let lat = request.body.coordinates.lat;        // '47.245059';   // '35.6762'; - Tokyo   ;   lat=47.245059'  - Tacoma
    let long = request.body.coordinates.long;       // '-122.438933'; // '139.6503' - Tokyo   ;   lon=-122.438933' - Tacoma

    const userLocation = (theUrl, thelat, theMiddleUrl1, theLong, theMiddleUrl2, theApiKey) => {
        let newUrl = theUrl + thelat + theMiddleUrl1 + theLong + theMiddleUrl2 + theApiKey;
        return newUrl;
    };

    //compose the weather URL form different parts
    const apiUrl = userLocation(url, lat, middleUrl1, long, middleUrl2, apiKey);

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
            });
        });
}, dtToHumanDate, 
   createCurrentWeather,
   createHourlyWeather,
   createDailyWeather, (request, response) => {

    
    // format the location name (NEW YORK) -> (New York)
    request.body.coordinates.city = "Your Mom's House";
    let words = request.body.coordinates.city.split(" ");
    for (let i  = 0; i < words.length; i++) {
        words[i] = words[i].toLowerCase();
        words[i] = words[i][0].toUpperCase() + words[i].slice(1);
    }
    let updatedLoc = words.slice(0, words.length).join(' ');

    response.status(201).send({
        success: true,
        location: updatedLoc + ", " + request.body.coordinates.region,
        currentData: request.body.currentData,
        hourData: request.body.hourData,
        dailyData: request.body.dailyData
    });

});

module.exports = router;