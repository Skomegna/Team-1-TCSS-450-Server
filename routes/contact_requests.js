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

const push_tools = require('../utilities/exports').pushyTools;
const sendNewContactRequestNotif = push_tools.sendNewContactRequestNotif;
const sendContactRequestResponseNotif = push_tools.sendContactRequestResponseNotif;

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
 * @apiDefine PushError
 * @apiError (400: SQL Push Error) {String} message 
              "SQL Error on select from push token"
 * @apiError (400: SQL Push Error) {String} error the error
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
 * @apiParamExample {json} Request-Body-Example:
 *     {
 *         "nickname": "theNickname"
 *     }

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
 * @apiUse PushError
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

}, (request, response, next) => {
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
            next();
        })
        .catch((err) => {
            // an sql error occurred
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        })    
}, (request, response) => {
    // send a notification for the new contact request 
    // to the sender and the reciever
    let query = `SELECT token FROM Push_Token
                 WHERE MemberId=$1 OR MemberId=$2`;
    let values = [request.decoded.memberid, request.body.otherMemberID];
    
    pool.query(query, values)
        .then(result => {

            result.rows.forEach(entry =>  
                sendNewContactRequestNotif(
                    entry.token,
                    request.body.otherMemberID,
                    request.decoded.memberid, 
                    request.decoded.nickname
                ));

            response.send({
                success: true
            });
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error on select from push token",
                error: err
            });
        });
});





/**
 * @api {get} /contacts/requests Request to recieve all contact requests an
                                 account has been sent and has sent.
 * @apiName GetContactRequest
 * @apiGroup Contacts/Requests
 * 
 * @apiDescription Responds with two arrays, one containing the sent contact 
                   requests and the other containing sent recieved
                   contact requests for a particular account.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess (Success 201) {boolean} success 
        true when the list of contact requests has been created and sent
 * @apiSuccess (Success 201) {array} receivedRequests
        an array of contact's information that sent you a request
 * @apiSuccess (Success 201) {array} sentRequests
        an array of contact's information that you send a request to
 *
 * @apiSuccessExample {json} Response-Success-Example:
 *  {
 *      "success":true,
 *      "receivedRequests":[
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
 *      ],
 *      "sentRequests":[
 *          {
 *              "memberid":"42",
 *              "first":"Charles",
 *              "last":"Bryan",
 *              "nickname": "Big C"
 *          }, 
 *          {
 *              "memberid":"234",
 *              "first":"John",
 *              "last":"Kennedy",
 *              "nickname": "RealJohnKennedy"
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
    // so we can go straight into trying to get all the requests
    // that were sent to this user from the database

    let query = `SELECT MemberID_A FROM Contact_Requests WHERE MemberID_B=$1`;
    let values = [request.decoded.memberid];
    pool.query(query, values)
        .then(result => {
            
            let resultRows = [];
            result.rows.forEach(row => resultRows.push(row.memberid_a));

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

}, getContactInfo, (request, response, next) => {
    // at this point request.body.contactInfoList will contain the contact
    // information for the users who sent the requester's account
    // a contact request. 
    request.body.receivedRequestContacts = request.body.contactInfoList;
    
    
    // get the member Ids for the contacts who this
    // account has sent a request to
    let query = `SELECT MemberID_B FROM Contact_Requests WHERE MemberID_A=$1`;
    let values = [request.decoded.memberid];

    pool.query(query, values)
        .then(result => {
         
            let resultRows = [];
            result.rows.forEach(row => resultRows.push(row.memberid_b));
            
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
    // request.body.contactInfoList contains the contact info for 
    // the contacts that have been sent requests from this user
    request.body.sentRequestContacts = request.body.contactInfoList;

    response.status(201).send({
        success: true,
        receivedRequests: request.body.receivedRequestContacts,
        sentRequests: request.body.sentRequestContacts
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

 * @apiParamExample {json} Request-Body-Example:
 *     {
 *         "memberID": "2343",
 *         "isAccepting": true
 *     }
 * 
 * @apiSuccess (Success 200) {boolean} success 
        true when the contact request has been accepted or rejected
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
 * @apiUse PushError
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
 
}, (request, response, next) => {
    // delete all instances of a contact request between
    //  these two members (can be either direction)

    let query = `DELETE FROM Contact_Requests WHERE
                 (MemberID_A=$1 AND MemberID_B=$2)
                 OR (MemberID_A=$2 AND MemberID_B=$1)`
    let values = [request.body.memberID, request.decoded.memberid];

    pool.query(query, values)
            .then(result => {
                next();
            })
            .catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    detail: err.detail
                });
            });   
}, (request, response, next) => {
    // get the nickname of the user who sent this user this request
    let query = `SELECT nickname FROM Members WHERE memberid=$1`;
    let values = [request.body.memberID];

    pool.query(query, values) 
        .then(result => {
            request.body.otherMemberNickname = result.rows[0].nickname;
            next();
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                detail: err.detail
            });
        })

}, (request, response) => {
    
    // everything was deleted successfully, so send pushy notifying the
    // contact request response and send the success response
    let query = `SELECT token FROM Push_Token
                 WHERE MemberId=$1 OR MemberId=$2`;
    let values = [request.body.memberID, request.decoded.memberid];
    
    pool.query(query, values)
        .then(result => {
            result.rows.forEach(entry =>  
                sendContactRequestResponseNotif(
                    entry.token,
                    request.decoded.memberid, 
                    request.body.memberID,
                    request.body.otherMemberNickname,
                    request.body.isAccepting
                ));

            response.send({
                success: true
            });
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error on select from push token",
                error: err
            });
        });
});


module.exports = router;