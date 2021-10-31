//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express router
var router = express.Router();

const pool = require('../utilities').pool;


const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;


/**
 * @api {post} /verify Request an message echo with a parameter 
 * @apiName PostVerify
 * @apiGroup Verify
 * 
 * @apiParam {String} Account email
 * 
 * @apuParam {Int} 6 Digit Verification Code 
 * 
 * @apiSuccess {String} Thank you for verification message.
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 */ 
router.post("/", (request, response, next) => {
    if (isStringProvided(request.body.email) && isStringProvided(request.body.code)) {
        next();
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }
}, (request, response, next) => {
    const email = request.body.email;
    const userCode = request.body.code;
    let theCodeQuery = "SELECT Code FROM VerificationCode WHERE Email=$1";
    let theValues = [email];
    pool.query(theCodeQuery, theValues)
        .then (result => {
            if (result.rows[0].code == userCode) {
                next();
            } else {
                response.status(400).send({
                    message: "Incorrect Code"
                });
            }
        })
        .catch((err) => {
            //log the error
            console.log(err.stack)
            response.status(400).send({
                message: err.detail
            })
        })

}, (request, response) => {
    const email = request.body.email;
    let theCodeQuery = "UPDATE Members SET Verification='1' WHERE email=$1"; 
    let theValues = [email];
    pool.query(theCodeQuery, theValues)
        .then (result => {
            response.status(201).send({
                success: true,
                //is there something you want me to return here?
            })
        })
        .catch((err) => {
            //log the error
            console.log(err.stack)
            response.status(400).send({
                message: err.detail
            })
        })
})

module.exports = router