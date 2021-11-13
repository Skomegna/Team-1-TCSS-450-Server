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
const pool = require('../utilities/exports').pool;

const validation = require('../utilities').validation;

const databaseUtils = require('../utilities/exports').database;
const checkNicknameExists = databaseUtils.checkNicknameExists;
const addMemberID = databaseUtils.addMemberID;

// validation tools
let isStringProvided = validation.isStringProvided;

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

/**
 * @apiDefine OtherError
 * @apiError (400: Other Error) {String} message "Other error, see detail"
 * @apiError (400: Other Error) {String} detail  the detail
 */ 

/**
 * @apiDefine SqlError
 * @apiError (400: SQL Error) {String} message "SQL Error"
 * @apiError (400: SQL Error) {String} error   the error
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
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Invalid nickname) {String} message "Nickname does not exist"
 * 
 * @apiError (400: Contact Request with Self) {String} message "Can not create contact with oneself"
 * 
 * @apiUse SQLError
 * 
 * @apiUse OtherError
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
}, checkNicknameExists, addMemberID, (request, response, next) => {
    // don't allow someone to create a contact with themself
    const myID = request.decoded.memberid;
    const otherID = request.body.otherMemberID;
    if (myID !== otherID) {
        next();
    } else {
        response.status(400).send({
            message: "Can not create contact with oneself",
        });
    }
    
}, (request, response, next) => {
    // check to make sure that the two members are not already contacts
    const query = `SELECT * FROM Contacts 
                   WHERE (MemberID_A=$1 AND MEMBERID_B=$2) 
                   OR (MemberID_A=$2 AND MEMBERID_B=$1)`;
    const values = [request.decoded.memberid, request.body.otherMemberID];

    // todo do the query
    
}, (request, response) => {
    // now that we have the ID for the requester and the person we want
    // to send the request to, we can add the request to the database
    const myID = request.decoded.memberid;
    const otherID = request.body.otherMemberID;

    let insert = `INSERT INTO Contacts 
                  (MemberID_A, MemberID_B) 
                  VALUES ($1, $2)`;

    let values = [myID, otherID];
    pool.query(insert, values)
        .then(result => {
            // successfully stored the contact request in the database
            response.status(201).send({ 
                success: true,
                message: "you're a bossman, boss man!"  
            });
        })
        .catch((err) => {
            // an sql error occurred while trying to 
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        })    
});


module.exports = router;




// might need for later: 
/*
    SELECT m.Nickname
    FROM Members m, Contacts c
    WHERE m.Memberid = c.Memberid_A
 */


