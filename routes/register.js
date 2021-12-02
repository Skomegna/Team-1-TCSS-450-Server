/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */
  
// used to handle requests
const express = require('express');

// Access the connection to Heroku Database
const pool = require('../utilities').pool;

const validation = require('../utilities').validation;

// validation tools
let isStringProvided = validation.isStringProvided;

const checkNickname = require('../utilities').database.checkNickname;
const deleteVerificationCodeRow = require('../utilities').validation.deleteVerificationCodeRow;
const createAndStoreCode = require('../utilities').validation.createAndStoreCode;

const generateHash = require('../utilities').generateHash;

const generateSalt = require('../utilities').generateSalt;

// function used to send email
const sendEmail = require('../utilities').sendEmail;

const router = express.Router();

const textUtils = require('../utilities').textUtils;
const checkEmail = textUtils.checkEmail;
const checkPassword = textUtils.checkPassword;  
const checkNames = textUtils.checkNames;


/**
 * @api {post} /auth Request to register a user
 * @apiName PostAuth
 * @apiGroup Auth
 * 
 * @apiDescription Request to register a new user for the app, 
                   requiring a first name, last name, unique nickname,
                   unique email, and password.    
 * 
 * @apiParam {String} first a users first name
 * @apiParam {String} last a users last name
 * @apiParam {String} email a users email *unique
 * @apiParam {String} password a users password
 * @apiParam {String} username a name for the user *unique
 * 
 * @apiParamExample {json} Request-Body-Example:
 *  {
 *      "first":"Charles",
 *      "last":"Bryan",
 *      "nickname": "Big C",
 *      "email":"cfb3@fake.email",
 *      "password":"test12345"
 *  }
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {String} email the email of the user inserted 
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "success": true,
 *       "email": "cfb3@fake.email"
 *     }
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: Invalid Parameter) {String} message "Invalid Parameter"
 * @apiError (400: Invalid Parameter) {String} detail  Explanation of what's 
                                                       wrong with the parametere
 * 
 * @apiError (400: Username exists) {String} message "Username exists"
 * 
 * @apiError (400: Email exists) {String} message "Email exists"
 * 
 * @apiError (400: Other Error) {String} message "Other error, see detail"
 * @apiError (400: Other Error) {String} detail the detail
 *
 */ 
router.post('/', (request, response, next) => {
    // first function is only for making sure credentials are given
   
    //Retrieve data from query params
    const first = request.body.first;
    const last = request.body.last;
    const nickname = request.body.nickname;
    const email = (request.body.email);
    const password = request.body.password;
    
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(isStringProvided(first) 
        && isStringProvided(last) 
        && isStringProvided(nickname) 
        && isStringProvided(email) 
        && isStringProvided(password)) {
      next();
    } else {
        response.status(400).send({
            message: "Missing required information"
        });
    }

}, checkNickname, checkNames, checkEmail, checkPassword,
    (request, response, next) => {

    //Retrieve data from query params
    const first = request.body.first;
    const last = request.body.last;
    const nickname = request.body.nickname;
    const email = (request.body.email).toLowerCase();
    const password = request.body.password;

    //We're storing salted hashes to make our application more secure
    //If you're interested as to what that is, and why we should use it
    //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
    let salt = generateSalt(32);
    let salted_hash = generateHash(password, salt);

    //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
    //If you want to read more: https://stackoverflow.com/a/8265319
    let theQuery = "INSERT INTO MEMBERS(FirstName, LastName, Nickname, Email, Password, Salt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING Email";
    let values = [first, last, nickname, email, salted_hash, salt];
    pool.query(theQuery, values)
        .then(result => {
            //We successfully added the user!
            next();
        })
        .catch((error) => {
            //log the error
            // console.log(error)
            if (error.constraint == "members_email_key") {
                response.status(400).send({
                    message: "Email exists"
                });
            }
        });
}, deleteVerificationCodeRow, createAndStoreCode, (request, response) => {
    const email = (request.body.email).toLowerCase();
    const code = request.body.code;
    sendEmail(email, "Welcome to our App!", "Please verify your Email account.\n" + "Your Verification Code: " + code);
    response.status(201).send({
        success: true,
        email: email
    });
});


module.exports = router;