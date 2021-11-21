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
 * @api {get} /chats/list/ Request to get a list chats the requester is a member in.
 * @apiName GetChats
 * @apiGroup Chats/List/
 * 
 * @apiDescription Responds with a list of chat objects the
                   request sender is a member of. Each chat object contains 
                   the name of the chat and the unique ID of the chat.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess {boolean} succes true when the list of chats is created
 * @apiSuccess {Array} data the array of objects that each
               contain a chatID and name
 *
 * @apiSuccessExample {json} Response-Success-Example:
 *  {
 *      "success":true,
 *      "data":[
 *          {
 *              "chatId":"1",
 *              "name":"Global Chat"
 *          }, 
 *          {
 *              "chatid":"2",
 *              "name":"Chat 2"
 *          }
 *      ]
 *  }
 *
 * @apiUse SQLError
 */
router.get('/', (request, response, next) => {
    // we know that jwt is given, so get database data
    let query = `SELECT chatid FROM ChatMembers WHERE MemberID=$1`;
    let values = [request.decoded.memberid];

    pool.query(query, values)
        .then(result => {
            request.body.chatIDs = result.rows;
            next();
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });
}, (request, response) => {
    // create a list of chatIDs and Chat names based on the 
    // chatIDs at requests.body.chatIDs
    
    
    if (request.body.chatIDs.length == 0) {
        // send an empty data array if we don't have any chat IDs to send
        response.status(201).send({
            success: true,
            data: []
        });
    } else {
        // get the chatID and the name from the list 
        // of chatIDs and send it 
        let query = "SELECT row_to_json(row(chatid, name)) FROM Chats WHERE ";
        for (let i = 0; i < request.body.chatIDs.length; i++) {
            query += "ChatID=" + request.body.chatIDs[i].chatid + " OR ";
        }
        query = query.substring(0, query.length - 3) + ";";
    
        pool.query(query)
            .then(result => {
                
                // format the data (see documentation for format)
                let resultArr = new Array(result.rowCount);

                for (let i = 0; i < resultArr.length; i++) {
                    let row = result.rows[i].row_to_json;
                    resultArr[i] = {
                        chatId: row.f1,
                        name: row.f2
                    };
                }
                
                response.status(201).send({
                    success: true,
                    data: resultArr
                });
            })
            .catch(error => {
                response.status(400).send({
                    message: "SQL Error",
                    error: error
                });
            }) 
    }

    
});

module.exports = router;


