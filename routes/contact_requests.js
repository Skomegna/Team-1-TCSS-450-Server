/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Contains the contacts/requests endpoints including
 *      - contacts/requests (POST) Create a new contact request
 *      - contacts/requests (GET)  Gets a list of contact requests
 *      - contacts/requests (PUT)  Accepts or rejects a contact request
 */

// used to handle requests
const express = require('express');
const router = express.Router();

// Access the connection to Heroku Database
const pool = require('../utilities/exports').pool;

const validation = require('../utilities').validation;

const databaseUtils = require('../utilities/exports').database;
const checkNicknameExists = databaseUtils.checkNicknameExists;
const checkMemberIDExists = databaseUtils.checkMemberIDExists;
const getContactInfo = databaseUtils.getContactInfo;
const addMemberID = databaseUtils.addMemberID;

// validation tools
let isStringProvided = validation.isStringProvided;

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */  

/**
 * @apiDefine SQLError
 * @apiError (400: SQL Error) {String} message "SQL Error"
 * @apiError (400: SQL Error) {String} error   the error
 */ 





/**
 * @api {post} /contacts/requests Request to create a contact request
 * @apiName PostContactRequest
 * @apiGroup Contacts/Requests
 * 
 * @apiDescription Creates a contact request from the request 
                   sender to the account specified by the given nickname
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam  {String} nickname 
        the nickname of the account the contact request is for
 *
 * @apiSuccess (Success 201) {boolean} success 
        true when the contact request has been created
 * 
 * @apiError (400: Missing Parameters) {String} message 
        "Missing required information"
 * 
 * @apiError (400: Invalid nickname) {String} message 
        "Nickname does not exist"
 * 
 * @apiError (400: Contact Request with Self) {String} message 
        "Can not create contact with oneself"
 * 
 * @apiError (400: Members are Contacts) {String} message 
        "Members are already contacts"
 * 
 * @apiError (400: Contact Request Exists) {String} message 
        "Contact request already exists"
 * 
 * @apiUse SQLError
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
            message: "Can not create contact with oneself"
        });
    }
    
}, (request, response, next) => {
    // check to make sure that the two members are not already contacts
    const query = `SELECT * FROM Contacts 
                   WHERE (MemberID_A=$1 AND MEMBERID_B=$2) 
                   OR (MemberID_A=$2 AND MEMBERID_B=$1)`;
    const values = [request.decoded.memberid, request.body.otherMemberID];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount != 0) {
                
                // if the row count is greater than 0, we know that there
                // is an existing connection between these two members,
                // so send an appropriate response
                response.status(400).send({ 
                    message: "Members are already contacts"
                });
            
            } else {
                next();
            }
        })
        .catch((err) => { 
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        })    
    
}, (request, response, next) => {
    // checks to see if the contact request from
    // memberID to otherMemberID already exists

    const query = `SELECT * FROM Contact_Requests 
                   WHERE (MemberID_A=$1 AND MEMBERID_B=$2) `;
    const values = [request.decoded.memberid, request.body.otherMemberID];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount != 0) {
                
                // if the row count is greater than 0, we know that there
                // is an existing contact request from memberA to memberB.
                response.status(400).send({ 
                    message: "Contact request already exists"
                });

            } else {
                next();
            }
        })
        .catch((err) => { 
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        })

}, (request, response) => {
    // add the request to the databasee
    const myID = request.decoded.memberid;
    const otherID = request.body.otherMemberID;

    let insert = `INSERT INTO Contact_Requests 
                  (MemberID_A, MemberID_B) 
                  VALUES ($1, $2)`;
    let values = [myID, otherID];

    pool.query(insert, values)
        .then(result => {
            // successfully stored the contact request in the database
            response.status(201).send({ 
                success: true, 
            });
        })
        .catch((err) => {
            // an sql error occurred
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        })    
});






/**
 * @api {get} /contacts/requests Request to recieve all contact requests an account has been sent.
 * @apiName GetContactRequest
 * @apiGroup Contacts/Requests
 * 
 * @apiDescription Responds with a list of contact requests that have 
                   been sent to the account that corresponds to the request sender.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess (Success 201) {boolean} success 
        true when the list of contact requests has been created and sent
 * @apiSuccess (Success 201) {array} data 
        an array of contact's information that sent you a request
 *
 * @apiSuccessExample {json} Response-Success-Example:
 *  {
 *      "success":true,
 *      "data":[
 *          {
 *              "memberid":"42",
 *              "first":"Charles",
 *              "last":"Bryan",
 *              "nickname": "Big C"
 *          }, 
 *          {
 *              "memberid":"167",
 *              "first":"Austn",
 *              "last":"Attaway",
 *              "nickname": "AustnSauce"
 *          }
 *      ]
 *  }
 *
 * @apiUse SQLError
 *
 * @apiUse JSONError 
 * 
 */
router.get('/', (request, response, next) => {
    // note: the JWT has already been checked by this point, 
    // so we can go straight into trying to get all requests
    // from the database

    let query = `SELECT * FROM Contact_Requests WHERE MemberID_B=$1`;
    let values = [request.decoded.memberid];

    pool.query(query, values)
        .then(result => {
            
            let resultRows = new Array(result.rowCount);
            for (let i = 0; i < result.rowCount; i++) {
                resultRows[i] = result.rows[i].memberid_a;
            }
            request.body.memberIDs = resultRows;
            next();
    
        })
        .catch(err => {
            // an sql error occurred while trying to 
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });

}, getContactInfo, (request, response) => {
    // getContactInfo will put the response 
    // data at request.body.contactInfoList
    response.status(201).send({
        success: true,
        data: request.body.contactInfoList
    });
});





/**
 * @api {put} /contacts/requests Request to accept or reject a contact request
 * @apiName PutContactRequest
 * @apiGroup Contacts/Requests
 * 
 * @apiDescription Provides support for accepting or rejecting 
                   an existing contact request that was sent to the 
                   account corresponding to the request sender.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} memberID 
        the memberID of the account you are accepting or rejecting
 * @apiParam {Boolean} isAccepting
        true if the request sender is accepting the request, false if rejecting
 *
 * @apiError (400: Missing Parameters) {String} message 
        "Missing required information"
 * 
 * @apiError (400: MemberID does not exist) {String} message
        "MemberID does not exist"
 * 
 * @apiError (400: Invalid Request) {String} message 
        "Contact request does not exist"
 * 
 * @apiUse SQLError
 *
 */
router.put('/', (request, response, next) => {
    // ensure that the required information was given
    let isAcceptingIsBoolean = request.body.isAccepting != undefined
            && (request.body.isAccepting == true
            || request.body.isAccepting == false);

    if (isStringProvided(request.body.memberID) 
            && isAcceptingIsBoolean) {
        next();
    } else {
        // missing required info
        response.status(400).send({
            message: "Missing required information"
        });
    }

}, checkMemberIDExists, (request, response, next) => {
    // check to make sure that the request exists between 
    // the memberID account and the sender of the request

    let query = `SELECT * FROM Contact_Requests 
                 WHERE MemberID_A=$1 AND MemberID_B=$2`
    let values = [request.body.memberID, request.decoded.memberid];
    
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 1) {
                // there is a request in the request table, so move on
                next();
            } else {
                // there isn't a request in the request table, so 
                // responsd accordingly
                response.status(400).send({
                    message: "Contact request does not exist",
                });
            }
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                detail: err.detail
            });
        })
}, (request, response, next) => {
    // if the request.body.isAccepting is true, add the connection
    // in the contacts database

    if (request.body.isAccepting) {
        
        let query = `INSERT INTO Contacts (MemberID_A, MemberID_B) 
                     VALUES ($1, $2)`;
        let values = [request.body.memberID, request.decoded.memberid];

        pool.query(query, values)
            .then(result => {
                // row was inserted successfully, so move on.
                next();
            })
            .catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    detail: err.detail
                });
            });
    } else {

        // request was rejected, so don't add connection and move on.
        next();
    }
 
}, (request, response) => {
    // delete all instances of a contact request between
    //  these two members (can be either direction)

    let query = `DELETE FROM Contact_Requests WHERE
                 (MemberID_A=$1 AND MemberID_B=$2)
                 OR (MemberID_A=$2 AND MemberID_B=$1)`
    let values = [request.body.memberID, request.decoded.memberid];

    pool.query(query, values)
            .then(result => {
                // everything was deleted successfully, so response success
                response.status(400).send({
                    success: true
                });
            })
            .catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    detail: err.detail
                });
            });   
});


module.exports = router;