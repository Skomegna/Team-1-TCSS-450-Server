/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Includes the auth/verify (POST) request for verifying an account using a code
 */

const express = require('express');

var router = express.Router();

const pool = require('../utilities').pool;

const validation = require('../utilities').validation;
const deleteVerificationCodeRow = require('../utilities').validation.deleteVerificationCodeRow;
let isStringProvided = validation.isStringProvided;

/**
 * @api {post} auth/verify Verify an account using a code
 * @apiName PostVerify
 * @apiGroup Auth/Verify
 * 
 * @apiDescription Accepts a 6 digit verification code that can be 
                   used to verify the account that corresponds to the given email.
 * 
 * @apiParam {String} email Account email
 * @apiParam {Int} code 6 Digit Verification Code 
 * 
 * @apiParamExample {json} Request-Body-Example:
 *     {
 *         "email": "theEmail@email.com",
 *         "code": 167530
 *     }
 * 
 * @apiSuccess {boolean} success true when the codes match.
 * @apiSuccess {String} message "Thank you for verifying"
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "success": true,
 *         "message": "Thank you for verifying",
 *     }
 * 
 * @apiError (400: Missing Parameters) {String} message 
 *           "Missing required information"
 * 
 * @apiError (400: Incorrect Account) {String} message 
 *           "Incorrect account information"
 * 
 * @apiError (400: Incorrect Code) {String} message 
 *           "Incorrect Code"
 * 
 * @apiError (400: Wrong Email) {String} message 
 *           "Please check credentials and try again."
 * 
 * @apiError (400: Other Error) {String} message "other error, see detail"
 * @apiError (400: Other Error) {String} detail  Information about the error
 */ 
router.post("/", (request, response, next) => {
    if (isStringProvided(request.body.email) && 
            isStringProvided(request.body.code)) {
        next();
    } else {
        response.status(400).send({
            message: "Missing required information"
        });
    };
}, (request, response, next) => {
    const email = (request.body.email).toLowerCase();
    const userCode = request.body.code;
    let theQuery = "SELECT Code FROM VerificationCode WHERE Email=$1";
    let theValues = [email];
    pool.query(theQuery, theValues)
        .then (result => {
            if (result.rows[0].code == userCode) {
                next();
            } else if (result.rows == 0) {
                response.status(400).send({
                    message: "Incorrect account information"
                });   
            } else {
                response.status(400).send({
                    message: "Incorrect Code"
                });
            };
        })
        .catch((error) => {
            if (error.detail == undefined) {
                response.status(400).send({
                    message: "Please check credentials and try again."
                });
            } else {
                response.status(400).send({
                    message: "other error, see detail",
                    detail: error.detail     
                });
            };
        });

}, (request, response, next) => {
    const email = (request.body.email).toLowerCase();
    let theQuery = "UPDATE Members SET Verification='1' WHERE email=$1"; 
    let theValues = [email];
    pool.query(theQuery, theValues)
        .then (result => {
            next();
        })
        .catch((err) => {
            //log the error
            console.log(err.stack);
            response.status(400).send({
                message: err.detail
            });
        });
}, deleteVerificationCodeRow, (request, response) => {
    response.status(201).send({
        success: true,
        message: "Thank you for verifying"
    });
});

module.exports = router;