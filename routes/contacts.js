/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Contains the contacts/endpoints including
 *      - contacts/ (GET)  Gets a list of contacts
 *      - contacts/ (DELETE) Delete a particular contact
 */

// used to handle requests
const express = require('express');
const router = express.Router();

// Access the connection to Heroku Database
const pool = require('../utilities/exports').pool;

const validation = require('../utilities').validation;

const databaseUtils = require('../utilities/exports').database;
const getContactInfo = databaseUtils.getContactInfo;

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
 * @api {get} /contacts/ Request to get a list of a user's contacts
 * @apiName GetContacts
 * @apiGroup Contacts/
 * 
 * @apiDescription Responds with a list of contacts that correspond to all
                   of the contacts the request sender's account has.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess {boolean} success true when the list is created and sent
 * @apiSuccess {Array} data the array of contact data objects
 * 
 * @apiUse SQLError
 * 
 * @apiUse JSONError
 * 
 */
router.get('/', (request, response, next) => {
    // we already checked to make sure that the given jwt is valid,
    // so we can just grab the data, format it, and send the response
    
    let memberID = request.decoded.memberid;

    let query = `SELECT * FROM Contacts 
                 WHERE MemberID_A=$1 OR MemberID_B=$1`;
    let values = [memberID];
    // todo add contscts with 491 for testing
    pool.query(query, values)
        .then(result => {
            request.body.contactRows = result.rows;
            next();
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });
}, (request, response, next) => {
    // the row of contact IDs is stoed at request.body.contactRows,
    // so now turn that into a list of memberIDs we need to get 
    // information for
    let contactRows = request.body.contactRows;
    let contactIDs = new Array(contactRows.length);

    for (let i = 0; i < contactRows.length; i++) {

        if (contactRows[i].memberid_a == request.decoded.memberid) {
            // the account that sent the request is
            // memberID_A, so add memberID_B
            contactIDs[i] = contactRows[i].memberid_b;

        } else {
            // the account that sent the request is
            // memberID_B, so add memberID_A
            contactIDs[i] = contactRows[i].memberid_a;
        }
    }
    

    // now get the information about each contact ID
    request.body.memberIDs = contactIDs;
    next();
    
}, getContactInfo, (request, response) => {
    // getContactInfo will put the response 
    // data at request.body.contactInfoList
    response.status(201).send({
        success: true,
        data: request.body.contactInfoList
    });
});





/**
 * @api {delete} /contacts/:contactID?/ Request to delete a contact
 * @apiName DeleteContact
 * @apiGroup Contacts/
 * 
 * @apiDescription Deletes the contact that connects the two members
                   specified by the given contactID and 
                   the ID of the request sender.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} contactID the memberID of the contact to be deleted
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. contactID must be a number"
 *
 * @apiUse SQLError
 */
 router.delete('/:contactID/', (request, response, next) => {
    // ensure the contactID is given and is a number
    if (!request.params.contactID) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else if (isNaN(request.params.contactID)){
        response.status(400).send({
            message: "Malformed parameter. contactID must be a number"
        });
    } else {
        next();
    }

 }, (request, response) => {
    // no need to check if the contactID is valid. Just go through the 
    // database and delete if if we see it. 

    let query = `DELETE FROM Contacts 
                 WHERE (MemberID_A=$1 AND MemberID_B=$2)
                 OR (MemberID_A=$2 AND MemberID_B=$1)`;
    let values = [request.params.contactID, request.decoded.memberid];

    pool.query(query, values)
        .then(result => {
            // successfully deleted the contacts if they existed, send success
            response.status(400).send({
                success: true
            });
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            });
        });
 });


module.exports = router;