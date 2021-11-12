/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Contains the contacts/requests endpoints including
 *      - contacts/requests (POST) Create a new contact request
 */

// used to handle requests
const express = require('express');
const router = express.Router();

// Access the connection to Heroku Database
const pool = require('../utilities').pool;

const validation = require('../utilities').validation;

// validation tools
let isStringProvided = validation.isStringProvided;

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 


/**
 * @api {post} /contacts/requests Request to create a contact request
 * @apiName PostContactRequest
 * @apiGroup Contacts/Requests
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam  {String} nickname the nickname of the account the 
                                contact request is for
 *
 * @apiSuccess (Success 201) {boolean} success true when the contact request has been created
 * 
 * @apiError (400: Missing Parameters) String} message "Missing required information"
 * 
 * 
 * 
 * @apiUse JSONError
 */
router.post('/', (request, response, next) => {
    // check to make sure the required nickname is provided
    // note: the JWT has already been checked by this point.
    if (!isStringProvided(request.body.nickname)) {
        response.status(400).send({ 
            message: "Missing required information"
        });
    } else {
        next();
    }
}, (request, response, next) => {
    // check to make sure that the given nickname is attatched to an account
    
});




module.exports = router;





