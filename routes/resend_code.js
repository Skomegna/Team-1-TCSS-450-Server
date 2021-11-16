/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

//express is the framework we're going to use to handle requests
const express = require('express');

//Access the connection to Heroku Database
const pool = require('../utilities').pool;

const validation = require('../utilities').validation;

const sendEmail = require('../utilities').sendEmail;
//validation tools
let isStringProvided = validation.isStringProvided;
const deleteVerificationCodeRow = require('../utilities').validation.deleteVerificationCodeRow;
const createAndStoreCode = require('../utilities').validation.createAndStoreCode;
const router = express.Router();

/**
 * @api {post} /auth/resendcode Send a new verification code to user
 * @apiName ResendCodeAuth
 * @apiGroup Auth/ResendCode
 * 
 * @apiParam {String} email a users email *unique
 * 
 * @apiParamExample {json} Request-Body-Example:
 *  {
 *      "email":"cfb3@fake.email"
 *  }
 * 
 * @apiSuccess (Success 201) {boolean} success true when code is created, stored, and sent in an email
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Invalid Email) {String} message "Incorrect email"
 * 
 * @apiError (400: Other Error) {String} message "Other error, see detail"
 * @apiError (400: Other Error) {String} detail the detail
 *
 */
router.post('/', (request, response, next) => {
    const email = request.body.email;
    console.log(email);
    if (isStringProvided(email)) {
        next();
    } else {
        response.status(400).send({
            message: "Missing required information"
        });
    }

}, (request, response, next) => {
    const email = request.body.email;
    let theValues = [email];
    let theQuery = "SELECT Email FROM Members WHERE Email=$1";
    pool.query(theQuery, theValues)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Incorrect Email"
                });
            }
            next();
        })
}, deleteVerificationCodeRow, createAndStoreCode, (request, response) => {
    const email = (request.body.email).toLowerCase();
    const code = request.body.code;
    sendEmail(email, "Welcome to our App!", "Please verify your Email account.\n" + "Your Verification Code: " + code);
    response.status(201).send({
        success: true
    });

});

module.exports = router;