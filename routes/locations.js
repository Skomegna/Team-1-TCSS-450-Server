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
 *              "lat":"47.2529"
 *              "long":"122.4443"
 *          }
 *          ...
 *          {
 *              "lat":"45.5152"
 *              "long":"122.6784"
 *          }
 *      ]
 *  }
 * 
 * @apiUse SQLError
 */
router.get('/', (request, response) => {
    // already know that jwt is checked and is valid, 
    // so get data from locations table
    let query = `SELECT Lat, Long FROM Locations WHERE MemberId=$1`;
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
        .then(result => {

            if (result.rowCount < MAX_LOCATIONS_ALLOWED) {
                next();
            } else {
                // throw a failure response if the usr can not add another 
                // location. Error thrown will cause the following catch to happen
                response.status(400).send({
                    message: "Max Location Storage Size Reached",
                });
            }

        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error from Location Storage Size",
            });
        });

}, (request, response, next) => {
    // check which params are given and act accordingly
    if (isStringProvided(request.body.lat)
            && isStringProvided(request.body.long)) {
        // lat/long is already provided so move on
        next();

    } else if (isStringProvided(request.body.zip)) {
        // zipcode is provided, so get the lat/long
        addLatLong(request, response, next);

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
    console.log(request.decoded.memberid);
    
    let query = `INSERT INTO Locations(MemberId, Lat, Long)
                 VALUES ($1, $2, $3)`;
    let values = [request.decoded.memberid, lat, long];

    pool.query(query, values)
        .then(result => {
            response.status(201).send({
                success: true
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
 * Adds the lat and long to the body given the 
 * zipcode at request.body.zip
 */
function addLatLong(request, response, next) {
    let zipcode = request.body.zip;

    if (zipcode.length < 5 || zipcode.length > 5) {
        // zipcode is not 5 digits.
        response.status(400).send({
            message: "Malformed parameter. Zip Code must be a five digits"
        })

    } else {
        // get the lat/long from zipcode
        const params = {
            auth: locationApiKey,
            locate: zipcode,
            region: 'US',
            json: '1'
        };

        axios.get(locationAPIurl, { params })
            .then(response => {
                // assign the retrieved lat and long to the body
                request.body.lat = response.data.latt;
                request.body.long = response.data.longt;
                next();

            }).catch(error => {
                response.status(400).send({
                    message: "ZIP to lat/lon API Error",
                    error: error
                })
            });
    }
}

module.exports = router;