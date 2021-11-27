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

// Access the connection to Heroku Database
const pool = require('../utilities/exports').pool;


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

module.exports = router;