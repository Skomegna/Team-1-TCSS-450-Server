/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Contains the locations/ endpoint
 *      - locations/ (GET)  Gets a user's list of saved locations
 */


// used to handle requests
const express = require('express');
const router = express.Router();

const axios = require('axios');

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;

// URL for API to convert zip code <--> lat/long and
// retrieve city name and regeon
const locationAPIurl = 'https://geocode.xyz';

// API key for location API
const locationApiKey = process.env.location_API_Key;

// Access the connection to Heroku Database
const pool = require('../utilities/exports').pool;

// The maximum number of locations a particular user is allowed to save
const MAX_LOCATIONS_ALLOWED = 10;


/**
 * @apiDefine SQLError
 * @apiError (400: SQL Error) {String} message "SQL Error"
 * @apiError (400: SQL Error) {String} error   the error
 */

/**
 * @api {get} /weather/locations/ Request to get the list of all saved weather locations for a particular account
 * @apiName GetLocations
 * @apiGroup Weather/Locations
 * 
 * @apiDescription Returns a list of weather locations corresponding to
                   the user who sent this request.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess {boolean} success true when the list of chats is created
 * @apiSuccess {Array} data the array of objects that each
               contain the location nickname, zipcode, latitude, and longitude
 * 
 * @apiSuccessExample {json} Response-Success-Example:
 *  {
 *      "success": true,
 *      "data":[
 *          {
 *              "nickname": "Tacoma",
 *              "lat":"47.2529"
 *              "long":"122.4443"
 *              "zip":"98402"
 *          }
 *          ...
 *          {
 *              "nickname": "Portland",
 *              "lat":"45.5152"
 *              "long":"122.6784"
 *              "zip":"97035"
 *          }
 *      ]
 *  }
 * 
 * @apiUse SQLError
 */

router.get('/', (request, response) => {
    // already know that jwt is checked and is valid, 
    // so get data from locations table
    let query = `SELECT Nickname, Lat, Long, Zip FROM Locations WHERE MemberId=$1`;
    let values = [request.decoded.memberid];

    pool.query(query, values)
        .then(result => {
            response.status(201).send({
                success: true,
                data: result.rows
            });
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });
});


/**
 * @api {post} /weather/locations/ Request to save a new location
 * @apiName PostLocation
 * @apiGroup Weather/Locations
 * 
 * @apiDescription Accepts a location (either lat/long or zipcode) and saves
                   that location in the database
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} zip a location's zip code
 * @apiParam {String} lat a location's latitude
 * @apiParam {String} long a location's longitude
 * 
 * @apiParamExample {json} Request-Body-Example:
 *  {
 *      "zip":"98338",
 *      "lat":"...",
 *      "long": "...",
 *  }
 * 
 * @apiSuccess {boolean} success true when the new location is saved
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
                                       Occurs if BOTH zipcode and 
                                       lat/long values are not given.
 * 
 * @apiError (400: Too Many Locations) {String} message "Location Storage Full"
 * 
 * @apiUse SQLError
 */
router.post('/', (request, response, next) => {
    // know jwt is already checked, so check to make sure we are allowed 
    // to add another location for this user
    let query = `SELECT * FROM Locations WHERE MemberId=$1`;
    let values = [request.decoded.memberid];

    pool.query(query, values)
        .then((results) => {
    
            if (results.rowCount < MAX_LOCATIONS_ALLOWED) {
                next();
            } else {
                response.status(400).send({
                    message: "Location Storage Full",
                    error: err
                });
            }
        })
        .catch((err) => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });

}, (request, response, next) => {
    // check to make sure params are given
    if (isStringProvided(request.body.zip)) {
        // add the lat long and location name to the body
        addLatLongAndLocation(request, response, next);

    } else if (isStringProvided(request.body.lat)
        && isStringProvided(request.body.long)) {
        // add the zipcode and location name to the body
        addZipAndLocation(request, response, next);

    } else {
        // don't have required information
        response.status(400).send({
            message: "Missing required information"
        });
    }
}, (request, response) => {
    // insert the new location into the database
    let lat = request.body.lat;
    let long = request.body.long;
    let zip = request.body.zip;
    let name = request.body.name;

    let query = `INSERT INTO Locations(MemberId, Nickname, Lat, Long, Zip)
                 VALUES ($1, $2, $3, $4, $5)`;
    let values = [request.body.memberid, name, lat, long, zip];

    pool.query(query, values)
        .then(result => {
            response.status(201).send({
                success: true,
            });
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });

});

/*
 * Adds the lat, long, and name to request.body
 */
function addLatLongAndLocation(request, response, next) {
    next();
}

/*
 * Adds the zipcode and location name to request.body
 */
function addZipAndLocation(request, response, next) {

    const params = {
        auth: locationApiKey,
        locate: request.body.lat + "," + request.body.long,
        json: '1'
    }

    axios.get(locationAPIurl, { params })
        .then(result => {
console.log(result);
            let city = result.data.osmtags.name;
            let region = result.data.osmtags.is_in_state_code;

            // assigned lat, long, region, and city to request
            request.body.region = region;
            request.body.city = city;
console.log(city + " " + region);
               
       
            // console.log("From lat/long: " + city + " " + region);
            next();

        }).catch(error => {
            response.status(400).send({
                message: "lat/long to city name API Error",
                error: error
            })
        });
}

module.exports = router;