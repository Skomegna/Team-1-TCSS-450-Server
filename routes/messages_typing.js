/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Contains the /messages/typing (post) endpoint that sends start/stop 
 * typing pushy notifications
 */

const express = require('express');
const router = express.Router();

const pool = require('../utilities/exports').pool;

const validation = require('../utilities/exports').validation;
let isStringProvided = validation.isStringProvided;

const sendTypingNotif = require('../utilities/exports').pushyTools.sendTypingNotif;


/**
 * @api {post} /messages/typing Request to send a pushy notification
               notifying users that someone started or stopped typing
 * @apiName PostMessageTyping
 * @apiGroup Messages/Typing
 * 
 * @apiDescription Sends a pushy notification to each member in the
                   given chat (request.body.chatId) notifying that 
                   the requester either started or stopped typing
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the id of the chat 
 * @apiParam {String} isStartingToType true or false depending on if the 
                      user just started typing or stopped typing
 * 
 * @apiSuccess (Success 200) {boolean} success true when the 
                                       pushy messages have been sent
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Malformed Parameter) {String} message "Malformed parameter. chatId must be a number"
 * 
 * @apiError (400: Unknown Chat ID) {String} message "Chat ID not found"
 * 
 * @apiError (400: Chat ID Error) {String} message "SQL Error on chatid check"
 * 
 * @apiError (400: Push Token Error) {String} message "SQL Error on select from push token"                  
 */ 
router.post('/', (request, response, next) => {
    // the JWT is already checked, so now check for the chatId 
    // and whether or not 
    if (request.body.chatId == undefined || request.body.isStartingToType == undefined) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else if (isNaN(request.body.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        });
    } else {
        next();
    };

}, (request, response, next) => {
    // validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1';
    let values = [request.body.chatId];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                });
            } else {
                next();
            };
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on chatid check",
                error: error
            });
        });
}, (request, response, next) => {
    // validate memberid exists in the chat
    let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2';
    let values = [request.body.chatId, request.decoded.memberid];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount > 0) {
                next();
            } else {
                response.status(400).send({
                    message: "user not in chat"
                });
            };
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on member in chat check",
                error: error
            });
        });
    
}, (request, response) => {
    // get all of the push tokens for the members in the given chat
    // and send the push token to those members
    // send a notification of this message to ALL members with registered tokens
    let query = `SELECT token FROM Push_Token
                    INNER JOIN ChatMembers ON
                    Push_Token.memberid=ChatMembers.memberid
                    WHERE ChatMembers.chatId=$1`;
    let values = [request.body.chatId];
    pool.query(query, values)
        .then(result => {
            result.rows.forEach(entry => 
                sendTypingNotif(entry.token, request.body.chatId));
            response.send({
                success:true
            });
        }).catch(err => {

            response.status(400).send({
                message: "SQL Error on select from push token",
                error: err
            });
        });
});

module.exports = router;