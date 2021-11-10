const express = require('express');
const pool = require('./sql_conn.js');
const router = express.Router();

/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
let isStringProvided = (param) =>
    param !== undefined && param.length > 0;


/**
 * Creates random verification code
 * that consists of 6 digits.
 * This code will be used to send to user
 * for verification purpose
 * @returns 
 */
function createCode() {
    let myNumber = (Math.floor(Math.random() * 900000) + 100000);
    return myNumber;
};


/**
 * Checks if the nickname located at request.body.nickname 
 * exists within the database Members table. 
 * 
 * If the username does not exist, call next.
 * If the username exists, send a 400 error { message: "Username exists" }
 */
function checkNickname(request, response, next) {
    const nickname = request.body.nickname;
    let theValues = [nickname];
    let theQuery = "SELECT Nickname FROM Members WHERE Nickname=$1";
    pool.query(theQuery, theValues)
        .then(result => {
            // query didn't find a nickname so the result array is empty
            if (result.rowCount == 0) {
                next();
            } else {
                response.status(400).send({
                    message: "Username exists"
                });
            }
        })
        .catch((err) => {
            //log the error
            console.log(err.stack);
            response.status(400).send({
                message: "Other error, see detail",
                detail: err.detail
            });
        });
};


/**
 * Deletes the row in the VerificationCode table corresponding
 * to the email given in request.body.email
 *  
 */
function deleteVerificationCodeRow(request, response, next) {

    let email = (request.body.email).toLowerCase();
    let theValues = [email];
    let theQuery = "DELETE FROM VerificationCode WHERE Email=$1";

    pool.query(theQuery, theValues)
        .then(result => {
            // successfully removed row, move onto next function
            next();
        })
        .catch((err) => {
            // fail response? needed? I am not sure if we do
            console.log(err.stack);
            response.status(400).send({
                message: "Other error, see detail",
                detail: err.detail
            });
        });

};

// create code, adds to to request
// add code to database

/**
 * Creates and stores code for secondary validation corresponding
 * to the e-mail given in request.body.email
 * updates stored code into request.body.code 
 */
function createAndStoreCode(request, response, next) {
    let userCode = createCode();
    let email = (request.body.email).toLowerCase();
    let theQuery = "INSERT INTO VerificationCode (Email, Code) VALUES ($1, $2) "
    let theValues = [email, userCode];

    pool.query(theQuery, theValues)
        .then(result => {
            request.body.code = userCode;
            next();
        })
        .catch((err) => {
            console.log(err.stack);
            response.status(400).send({
                message: "Other error, see detail",
                detail: err.detail
            });
        });
}

module.exports = {
    createCode,
    isStringProvided,
    checkNickname,
    deleteVerificationCodeRow,
    createAndStoreCode
};