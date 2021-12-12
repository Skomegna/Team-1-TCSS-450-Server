/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Includes endpoint /password/reset (PUT) Request to reset one's password
 */

const express = require('express');

const pool = require('../utilities').pool;

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;
const deleteVerificationCodeRow = require('../utilities').validation.deleteVerificationCodeRow;

const generateHash = require('../utilities').generateHash;
const generateSalt = require('../utilities').generateSalt;

const router = express.Router();

const textUtils = require('../utilities').textUtils;
const checkEmail = textUtils.checkEmail;
const checkPassword = textUtils.checkPassword;  

/**
 * @api {put} /password/reset Request to reset one's password
 * @apiName PasswordReset
 * @apiGroup Password
 * 
 * @apiDescription Request to reset one's password given an email that
 *                 corresponds to their account, 
 *                 a new password, and a verification code that was 
 *                 sent to their email.
 * 
 * @apiParam {String} email Account email
 * @apiParam {String} newPassword the new password
 * @apiParam {Int} code 6 Digit Verification Code 
 * 
 * @apiParamExample {json} Request-Body-Example:
 *     {
 *         "email": "AndroidSucks@Apple.com",
 *         "newPassword": "@ndr0iDSu3s",
 *         "code": "867530"
 *     }
 * 
 * @apiSuccess {boolean} success true when the password is reset
 * 
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *     }
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Invalid Parameter) {String} message "Invalid Parameter"
 * @apiError (400: Invalid Parameter) {String} detail  What is wrong about the given param 
 * 
 * @apiError (400: Invalid Email) {String} message "Email does not exist
 * 
 * @apiError (400: Invalid Code) {String} message "Code is not valid"
 * 
 * @apiError (400: SQL Error) {String} message "SQL Error"
 * @apiError (400: SQL Error) {String} error the error
 */ 
router.put('/', (request, response, next) => {
    // ensure that required information is given
    if (!isStringProvided(request.body.email) 
            || !isStringProvided(request.body.newPassword)
            || !isStringProvided(request.body.code)) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else {
        // place the new password at request.body.password so we can check it
        request.body.password = request.body.newPassword;
        next();
    }
}, checkEmail, checkPassword, (request, response, next) => {
    // the user will always have a verification code in the code table
    // if they make this request, so we can check to see if the email 
    // and code is valid in a single sql query

    let query = `SELECT code FROM VerificationCode 
                 WHERE email='${request.body.email}'`;
    
    pool.query(query)
        .then(result => {
            if (result.rowCount != 0) {
                // an account exists with the given email
                // and a code exists in the code database
                request.body.storedCode = result.rows[0].code;
                next();
            } else {
                // an account does not exist with the given email
                // and a code does not exist
                response.status(400).send({
                    message: "Email does not exist"
                });
            }
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });
    
}, (request, response, next) => {
    // check to make sure the given verification code matches 
    // the code in the table attatched to that account
    
    let storedCode = request.body.storedCode;

    if (storedCode == request.body.code) {
        // the code is the same, so they are verified.
        next();
    } else {
        // the code is not the same, so they can't update their password
        response.status(400).send({
            message: "Code is not valid"
        });
    }

}, deleteVerificationCodeRow, (request, response) => {
    // take the new password and update the database

    const email = (request.body.email).toLowerCase();
    const password = request.body.newPassword;

    // get the stalted hash
    let salt = generateSalt(32);
    let salted_hash = generateHash(password, salt);

    let query = `UPDATE Members SET password=$1 , salt=$2 WHERE email=$3`;
    let values = [salted_hash, salt, email];

    pool.query(query, values)
        .then(result => {
            response.send({
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

module.exports = router;