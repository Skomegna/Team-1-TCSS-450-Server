/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Includes the /auth (GET) Request to sign a user in the system
 */

const express = require('express');

const pool = require('../utilities').pool;

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;

const generateHash = require('../utilities').generateHash;

const router = express.Router();

const textUtils = require('../utilities').textUtils;
const checkEmail = textUtils.checkEmail;
const checkPassword = textUtils.checkPassword;  

//Pull in the JWT module along with out a secret key
const jwt = require('jsonwebtoken');
const config = {
    secret: process.env.JSON_WEB_TOKEN
};

/**
 * @api {get} auth Request to sign a user in the system
 * @apiName GetAuth
 * @apiGroup Auth
 * 
 * @apiDescription Request to sign in an existing user in to the service. 
                   Requires an email and password and will respond with
                   a valid JWT that proves they have logged in.
 * 
 * @apiHeader {String} authorization "username:password" uses Basic Auth 
 * 
 * @apiSuccess {boolean} success true when the name is found and password matches
 * @apiSuccess {String} message "Authentication successful!"
 * @apiSuccess {String} token JSON Web Token
 * 
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Authentication successful!",
 *       "token": "eyJhbGciO...abc123"
 *     }
 * 
 * @apiError (400: Missing Authorization Header) {String} message 
 *           "Missing Authorization Header"
 * 
 * @apiError (400: Malformed Authorization Header) {String} message 
 *           "Malformed Authorization Header"
 * 
 * @apiError (400: Invalid Parameter) {String} message "Invalid Parameter"
 * @apiError (400: Invalid Parameter) {String} detail  Explanation of what's 
                                                       wrong with the parameter
 * 
 * @apiError (404: User Not Found) {String} message "User not found"
 * 
 * @apiError (400: Invalid Credentials) {String} message 
 *           "Credentials did not match"
 * 
 * @apiError (400: Unverified Email) {String} message "Email is not verified"
 * 
 * @apiError (400: Other Error) {String} message "other error, see detail"
 * @apiError (400: Other Error) {String} detail  Information about the errorr
 */ 
router.get('/', (request, response, next) => {
    if (isStringProvided(request.headers.authorization) && 
            request.headers.authorization.startsWith('Basic ')) {
        next();
    } else {
        response.status(400).json({ 
            message: 'Missing Authorization Header'
        });
    };
}, (request, response, next) => {
    // obtain auth credentials from HTTP Header
    const base64Credentials =  request.headers.authorization.split(' ')[1];
    
    const credentials = 
            Buffer.from(base64Credentials, 'base64').toString('ascii');

    const [email, password] = credentials.split(':');

    if (isStringProvided(email) && isStringProvided(password)) {
        request.body.email = email;
        request.body.password = password;
        request.auth = { 
            "email" : email,
            "password" : password
        }
        next();
    } else {
        response.status(400).send({
            message: "Malformed Authorization Header"
        });
    };
}, checkEmail, checkPassword, (request, response) => {
    const theQuery = "SELECT Password, Salt, MemberId, FirstName, LastName,"
            + "Nickname, Verification FROM Members WHERE Email=$1";
    const theEmail = (request.auth.email).toLowerCase();
    const values = [theEmail];
    pool.query(theQuery, values)
        .then(result => { 
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: 'User not found' 
                });
                return;
            };

            //Retrieve the salt used to create the
            // salted-hash provided from the DB
            let salt = result.rows[0].salt;
            
            //Retrieve the salted-hash password provided from the DB
            let storedSaltedHash = result.rows[0].password;

            //Generate a hash based on the stored salt and the provided password
            let providedSaltedHash = generateHash(request.auth.password, salt);

            // If email is verified
            let ifVerified = result.rows[0].verification;

            //Did our salted hash match their salted hash?
            //Is email verified?
            if (storedSaltedHash === providedSaltedHash && ifVerified == 1) {
                //credentials match. get a new JWT
                let token = jwt.sign(
                    {
                        "email": request.auth.email,
                        "memberid": result.rows[0].memberid,
                        "nickname": result.rows[0].nickname,
                        "firstname": result.rows[0].firstname,
                        "lastname": result.rows[0].lastname,
                    },
                    config.secret,
                    { 
                        expiresIn: '14 days' // expires in 14 days
                    }
                );
                //package and send the results
                response.json({
                    success: true,
                    message: 'Authentication successful!',
                    token: token
                });
            } else if (storedSaltedHash != providedSaltedHash) {
                //credentials dod not match
                response.status(400).send({
                    message: 'Credentials did not match' 
                });
            } else if(ifVerified != 1) {
                //email did not verify
                response.status(400).send({
                    message: "Email is not verified"
                });
            } else {
                response.status(400).send({
                    message: "other error, see detail",
                    detail: error.detail
                });
            };
        })
        .catch((err) => {
            //log the error
            console.log(err.stack)
            response.status(400).send({
                message: err.detail
            });
        });
});

module.exports = router;