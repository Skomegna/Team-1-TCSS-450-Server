/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Contains the contacts/endpoints including
 *      - chats/list/ (GET)  Gets a user's list of chats
 */

// used to handle requests
const express = require('express');
const router = express.Router();

// Access the connection to Heroku Database
const pool = require('../utilities/exports').pool;


/**
 * @apiDefine SQLError
 * @apiError (400: SQL Error) {String} message "SQL Error"
 * @apiError (400: SQL Error) {String} error   the error
 */ 

/**
 * @api {get} /chats/all/ Request to get a list chats the requester is a member in.
 * @apiName GetChats
 * @apiGroup Chats/All/
 * 
 * @apiDescription Responds with a list of chat objects the
                   request sender is a member of. Each chat object contains 
                   the name of the chat, a unique id of the chat, 
                   the most recent message, 
                   and the timestamp of when the most recent message was sent.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess {boolean} success true when the list of chats is created
 * @apiSuccess {Array} data the array of objects that each
               contain a chatID and name
 *
 * @apiSuccessExample {json} Response-Success-Example:
 *  {
 *      "success":true,
 *      "data":[
 *          {
 *              "chatid": 42,
 *              "message": "This is the most recent message!",
 *              "timestamp": "2021-11-21T17:14:05.305Z",
 *              "chat_name": "Global Chat"
 *          }, 
 *          ...
 *          {
 *              "chatid": 33,
 *              "message": "But why do we need weather in a chat app?",
 *              "timestamp": "2021-11-21T17:44:48.012Z",
 *              "chat_name": "Steven, Austn, Parker, Alex, and Chris"
 *          }, 
 *      ]
 *  }
 *
 * @apiUse SQLError
 */
router.get('/', (request, response) => {
    // we know that jwt is given and is valid, 
    // so we can immediately get the database data
    let query = `SELECT m.chatid AS chatid,
                 m.message AS message, 
                 m.timestamp AS timestamp, 
                 c.name AS chat_name
                 FROM Messages m, chats c WHERE m.chatID = c.chatID AND m.chatID IN 
                 (SELECT chatID FROM ChatMembers WHERE memberid=$1) 
                 AND primarykey IN (select max(primarykey) 
                 FROM Messages GROUP BY chatid, c.name)`;
    let values = [request.decoded.memberid];

    pool.query(query, values)
        .then(result => {
            response.status(201).send({
                success: true,
                data: result.rows
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


