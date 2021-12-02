/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Accept a chatId and return a list of contact objects that are the members in the chat.
 *          Get the chatIds for that particualr chat.
 */


// used to handle requests
const express = require('express');
const router = express.Router();

// Access the connection to Heroku Database
const pool = require('../utilities/exports').pool;

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;


/**
 * @api {get} /chat_members/:chatId? Request to get chat members list 
 * @apiName Getchat_members
 * @apiGroup Chats
 * 
 * @apiDescription Request to get a list of all participants from the requested chat ID.
 * 
 * @apiParam {Number} chat id. 
 * 
 * @apiSuccess (Success 201) {boolean} success true if the data is given
 *
 * @apiSuccess (Success 201) {Array}  list the JSON object 
                                      containing the data with the 
                                      all chat members
 * 
 * @apiSuccessExample {json} Response-Success-Example:
 * {
    "success": true,
    "chatMembersList": [
        {
            "memberid": 556,
            "firstname": "Steven",
            "lastname": "Omegna1",
            "nickname": "Steven1",
            "email": "s***a@uw.edu"
        },
        {
            "memberid": 554,
            "firstname": "Parker",
            "lastname": "Rosengreen",
            "nickname": "Muscles",
            "email": "p***9@uw.edu"
        }
    ]
}
 *   
* @apiError (404: Missing Parameters) {String} message
 *                                              "Missing ChatId parameter"
 *    
 * @apiError (404: Invalid Parameter) {String} message
 *                                              "ChatId have to be an integer"
 * 
 * @apiError (400: Invalid Parameter) {String} message "The chat Id does not exist"
 * 
 * @apiError (400: Invalid Parameter) {String} message "The user unidentified"
 * 
 * @apiError (400: Database error) {String} message "SQL Error"
 * 
 * @apiUse JSONError
 */
router.get("/:chatId?", (request, response, next) => {
    if (isStringProvided(request.params.chatId)) {
        next();
    } else {
        response.status(400).json({ message: 'Missing ChatId parameter' });
    };
}, (request, response, next) => {
    if (isNaN(request.params.chatId)) {
        response.status(400).json({ message: 'ChatId have to be an integer' });
    } else {
        next();
    };
}, (request, response, next) => {

    // Retrieving user-id of a user who requested chat information
    let userId = request.decoded.memberid;

    // getting data from the database 
    let query = `SELECT Members.MemberID, FirstName, LastName, Nickname, Email FROM Members, ChatMembers
        WHERE ChatMembers.MemberID = Members.MemberID AND ChatMembers.ChatID=$1`;

        // let query = `SELECT ChatID FROM Chats`;
        
    let cId = [request.params.chatId];
    pool.query(query, cId)
        .then(result => {
            let list = result.rows;
            
            // iterate over each element in the array
            for (var i = 0; i < list.length; i++){

                // look for the entry with a matching memberId value
                if (list[i].memberid == userId){
                    // delete object with current member
                    list.splice(i, 1);
                    // assign the list of chat participants to request.body.list
                    request.body.list = list;
                }
            }
            // if a particular user is not in the asked chat, it gives an error.
            if (request.body.list != undefined) {
                next();
            } else if (result.rowCount == 0) {   // checking if chat id is correct
                response.status(400).send({
                    message: "The chat Id does not exist"
                });
            } else {
                response.status(400).send({
                    message: "The user unidentified"
                });
            }
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });
        
}, (request, response) => {

    // returns list of chat members
    response.status(201).send({
        success: true,
        chatMembersList: request.body.list
    });

});

module.exports = router;