/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Includes endpoint /password/change (PUT) Request to change one's password
 */

const express = require('express');

const pool = require('../utilities').pool;

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;

const checkPassword = require('../utilities').textUtils.checkPassword;

const generateHash = require('../utilities').generateHash;
const generateSalt = require('../utilities').generateSalt;

const router = express.Router();

/**
 * @api {put} password/change Request to change one's password
 * @apiName PasswordChange
 * @apiGroup Password
 * 
 * @apiDescription Request to change a user's password assuming that the user
                   already knows their current password. Requires JWT.
 *
 * @apiParam {String} oldPassword The users old password
 * @apiParam {String} newPassword The users new password to set
 *
 * @apiParamExample {json} Request-Body-Example:
 *     {
 *         "oldPassword": "AndroidSucks1!",
 *         "newPassword": "@ndr0iDSu3s!",
 *     }
 * 
 * @apiSuccess {boolean} success true when the new password has been set
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Invalid Parameter) {String} message "Invalid Parameter"
 * @apiError (400: Invalid Parameter) {String} detail  What is wrong about the given param 
 * 
 * @apiError (400: Password Doesn't Match) {String} message "Password doesn't match"
 * 
 * @apiError (400: SQL Error) {String} message "SQL Error"
 * @apiError (400: SQL Error) {String} error the error
 */
router.put('/', (request, response, next) => {
    // todo: is there a more secure way to send params to endpoint than body?
    // check to make sure params were given
    if (!isStringProvided(request.body.oldPassword) || 
            !isStringProvided(request.body.newPassword)) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else {
        // use the password validations to make sure the given 
        // passwords are valid (contain neccessary chars etc)
        request.body.password = request.body.oldPassword;
        next();
    }
}, checkPassword, (request, response, next) => {
    request.body.password = request.body.newPassword;
    next();
}, checkPassword, (request, response, next) => {
    // check to make sure the given oldPassword matches the current password
    let query = `SELECT salt, password FROM Members WHERE MemberID=$1;`;
    let values = [request.decoded.memberid];

    pool.query(query, values)
        .then(result => {
            // check to make sure that the stored password 
            // is the same as the given password
            request.body.storedSalt = result.rows[0].salt;
            request.body.storedSaltedHash = result.rows[0].password;
            next();
        })
        .catch(error => {
            response.status(400).send({
                message: "SQL Error",
            });
        })
}, (request, response, next) => {
    // store the new password in the database
    let providedSaltedHash = generateHash(request.body.oldPassword,
            request.body.storedSalt);

    if (request.body.storedSaltedHash === providedSaltedHash) {
        next();
    } else {
        response.status(400).send({
            message: "Password doesn't match"
        });
    }

}, (request, response, next) => {
    // store the new password
    const password = request.body.newPassword;

    let salt = generateSalt(32);
    let salted_hash = generateHash(password, salt);

    let query = `UPDATE Members SET password=$1 , salt=$2 WHERE memberid=$3`;
    let values = [salted_hash, salt, request.decoded.memberid];

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