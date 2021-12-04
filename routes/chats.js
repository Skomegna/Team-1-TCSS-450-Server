/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

// use express to handle requests
const express = require('express');

// access the connection to Heroku Database
const pool = require('../utilities/exports').pool;

const router = express.Router();

const msg_functions = require('../utilities/exports').pushyTools;

const validation = require('../utilities').validation;
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



/*
 * Given a list of memberIds request.body.memberIds, 
 * filter out all memberIds that are not in the members 
 * table or correspond to members who are not verified.
 * 
 * Also filters out all memberIds that are not a number.
 * 
 * Throws a 400 SQL Error if something odd happens with the database
 */
function filterChatIds(request, response, next) {
    
    let memberIds = request.body.memberIds
            .filter(memberId => !isNaN(memberId));

    // don't check the database if there aren't any members
    if (memberIds.length == 0) {
        next();
    } else {
        // concatenate the query to select memberIds for every
        // member in memberIds. 
        let query = "SELECT memberid from Members WHERE (";
        for (let i = 0; i < memberIds.length; i++) {

            query += "memberid=" + memberIds[i];
        
            if (i + 1 != memberIds.length) {
                // no more ids to check, so don't include ' OR '
                query += " OR ";
            }
        }
        query += ") AND verification=1"

        pool.query(query)
            .then(result => {
                
                // the query results in a array of memberIds that are
                // from the original list but are also checked 
                // to make sure they are members and they are verified.
                let resultRows = [];
                result.rows.forEach(row => resultRows.push(row.memberid));
                request.body.memberIds = resultRows;
                next();

            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                });
            });
        }

};



/*
 * Adds the chat members in request.body.memberIds to the
 * chat specified byrequest.body.chatId
 * 
 * Can cause a 400 error "Error occurred while adding members" 
 */
function addChatMembers(request, response, next) {
    let chatId = request.body.chatId;
    let memberIds = request.body.memberIds;
    let memberIdLength = request.body.memberIds.length;

    if (memberIds.length == 0) {
        next();
    } else {
        // build the query
        let query = "INSERT INTO ChatMembers (chatid, memberid) VALUES ";
        for (let i = 0; i < memberIdLength; i++) {
            query += "(" + chatId + ", " + memberIds[i] + "), ";
        }
        // remove that annoying ',' as a result of the last for loop
        query = query.substring(0, query.length - 2);

        pool.query(query)
            .then(result => {
                next();
            })
            .catch(err => {
                response.status(400).send({
                    message: "Error occurred while adding members",
                    error: err
                });
            });
    }
}



/**
 * @api {post} /chats Request to add a chat
 * @apiName PostChats
 * @apiGroup Chats
 * 
 * @apiDescription Request to create a new chat with the given name and list of members
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} name the name for the chat
 * @apiParam {Array} memberIds the array of memberIds to add to the chat
                               (do not include the request sender id, 
                               that is implied)
 * @apiParam {String} firstMessage the first message sent in the 
                                   chat by the user who created this chat
 * 
 * @apiParamExample {json} Request-Body-Example:
 *     {
 *         "name": "Austn, Parker, Steve, Alex, and Chris",
 *         "memberIds": [542, 543, 544, 545],
 *         "firstMessage": "The first message sent!"
 *     }
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {Number} chatId the generated chatId
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Member Insertion Error) {String} message "Error occurred while adding members"
 * 
 * @apiError (400: Message Insertion Error) {String} message "SQL Error inserting message"
 * 
 * @apiError (400: Push Token Error) {String} message "SQL Error on select from push token"
 * 
 * @apiError (400: Unknown Error) "message": "unknown error"
 * 
 * @apiUse SQLError
 * 
 * @apiUse JSONError
 */ 
router.post("/", (request, response, next) => {
    // make sure data is given
    if (!isStringProvided(request.body.name)
            || request.body.memberIds == undefined
            || !isStringProvided(request.body.firstMessage)) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else {
        next();
    };
}, filterChatIds, (request, response, next) => {
    // insert the new chat into the chats table 
    let query = "INSERT INTO Chats(Name) VALUES (\'" 
            + request.body.name + "\') RETURNING ChatId";

    pool.query(query)
        .then(result => {
            request.body.chatId = result.rows[0].chatid;
            next();
            
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });

 }, addChatMembers, (request, response, next) => {
    // we added the other members, but we should also add ourself
    let query = "INSERT INTO ChatMembers (chatid, memberid) VALUES ($1, $2)";
    let values = [request.body.chatId, request.decoded.memberid];

    pool.query(query, values)
        .then(response => {
            next();
        })
        .catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        })

 }, (request, response, next) => {
    // add the message to the database
    let insert = `INSERT INTO Messages(ChatId, Message, MemberId)
                  VALUES($1, $2, $3) 
                  RETURNING PrimaryKey AS MessageId, ChatId, Message, MemberId AS email, TimeStamp`;
    let values = [request.body.chatId,
                  request.body.firstMessage,
                  request.decoded.memberid];

    pool.query(insert, values)
        .then(result => {
            if (result.rowCount == 1) {
                //insertion success. Attach the message to the Response obj
                response.message = result.rows[0];
                response.message.nickname = request.decoded.nickname;
                //Pass on to next to push
                next();
            } else {
                response.status(400).send({
                    "message": "unknown error"
                });
            };

        }).catch(err => {
            response.status(400).send({
                message: "SQL Error inserting message",
                error: err
            });
        });

}, (request, response) => {
    // send a notification of the new message to all of the chat members
    let query = `SELECT token FROM Push_Token
                    INNER JOIN ChatMembers ON
                    Push_Token.memberid=ChatMembers.memberid
                    WHERE ChatMembers.chatId=$1`;
    let values = [request.body.chatId];
    pool.query(query, values)
        .then(result => {
            result.rows.forEach(entry => 
                msg_functions.sendMessageToIndividual(
                    entry.token, 
                    response.message));
            response.send({
                success: true,
                chatID: request.body.chatId,
                chatName: request.body.name
            });
        }).catch(err => {

            response.status(400).send({
                message: "SQL Error on select from push token",
                error: err
            });
        });
});


/**
 * @api {put} /chats/:chatId? Request add a list of users to a chat
 * @apiName PutChats
 * @apiGroup Chats
 * 
 * @apiDescription Adds the list of given users to the given chat
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to add the user to
 * @apiParam {Array} memberIds the array of memberIds to add to the chat
 * @apiParam {String} message the message that is sent by the requester 
                              that notes who was added to the chat  
 * 
 * @apiSuccess {boolean} success true when the members is inserted
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * 
 * @apiError (400: Chat Not Found) {String} message "Chat ID not found"
 * 
 * @apiError (400: Unknown Error) "message": "unknown error"
 * 
 * @apiError (400: Message Insertion Error) {String} message "SQL Error inserting message"
 * 
 * @apiError (400: Push Token Error) {String} message "SQL Error on select from push token"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse SQLError
 * 
 * @apiUse JSONError
 */ 
router.put("/", (request, response, next) => {
    // ensure params are given
    if (!request.body.chatId || 
            request.body.memberIds == undefined ||
            !isStringProvided(request.body.message)) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else if (isNaN(request.body.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        });
    } else {
        next();
    }
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
                message: "SQL Error",
                error: error
            });
        });

}, filterChatIds, (request, response, next) => {
    // we need a way to prevent duplicate members in the chatMembers table.
    // an easy, quick fix to do this would be to delete all members that
    // will be added back in the next function
    
    // todo: this approach will probably be slow once we have many 
    // chat members, so we should consider other approaches in the future. 
    let memberIds = request.body.memberIds;
    if (memberIds.length == 0) {
        next();
    } else {
        let query = `DELETE FROM ChatMembers WHERE `
        memberIds.forEach(memberId => {
            query += `(chatid=${request.body.chatId} 
                        and memberid=${memberId}) or `;
        });
        // remove the pesky trailing 'or ' from the query
        query = query.substring(0, query.length - 4)

        pool.query(query)
            .then(result => next())
            .catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: error
                });
            })
    }


}, addChatMembers, (request, response, next) => {
    // add the message to the database
    let insert = `INSERT INTO Messages(ChatId, Message, MemberId)
                  VALUES($1, $2, $3) 
                  RETURNING PrimaryKey AS MessageId, ChatId, Message, MemberId AS email, TimeStamp`;
    let values = [request.body.chatId,
                  request.body.message,
                  request.decoded.memberid];

    pool.query(insert, values)
        .then(result => {
            if (result.rowCount == 1) {
                //insertion success. Attach the message to the Response obj
                response.message = result.rows[0];
                response.message.nickname = request.decoded.nickname;
                //Pass on to next to push
                next();
            } else {
                response.status(400).send({
                    "message": "unknown error"
                });
            };

        }).catch(err => {
            response.status(400).send({
                message: "SQL Error inserting message",
                error: err
            });
        });

}, (request, response) => {
    // send a notification of the new message to all of the chat members
    let query = `SELECT token FROM Push_Token
                    INNER JOIN ChatMembers ON
                    Push_Token.memberid=ChatMembers.memberid
                    WHERE ChatMembers.chatId=$1`;
    let values = [request.body.chatId];
    pool.query(query, values)
        .then(result => {
            result.rows.forEach(entry => 
                msg_functions.sendMessageToIndividual(
                    entry.token, 
                    response.message));
            response.send({
                success: true,
            });
        }).catch(err => {

            response.status(400).send({
                message: "SQL Error on select from push token",
                error: err
            });
        });
});





/**
 * @api {get} /chats/:chatId? Request to get the emails of user in a chat
 * @apiName GetChats
 * @apiGroup Chats
 * 
 * @apiDescription Request to return all of the emails that correspond
                   to the accounts present in the chat corresponding
                   to the given chatId. 
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to look up. 

 * 
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} members List of members in the chat
 * @apiSuccess {String} messages.email The email for the member in the chat
 * 
 * @apiError (404: ChatId Not Found) {String} message "Chat ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.get("/:chatId", (request, response, next) => {
    //validate on missing or invalid (type) parameters
    if (!request.params.chatId) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        });
    } else {
        next();
    };
},  (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1';
    let values = [request.params.chatId];

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
                message: "SQL Error",
                error: error
            });
        });
    }, (request, response) => {
        //Retrieve the members
        let query = `SELECT Members.Email 
                    FROM ChatMembers
                    INNER JOIN Members ON ChatMembers.MemberId=Members.MemberId
                    WHERE ChatId=$1`;
        let values = [request.params.chatId];
        pool.query(query, values)
            .then(result => {
                response.send({
                    rowCount : result.rowCount,
                    rows: result.rows
                });
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                });
            });
});

/**
 * @api {delete} /chats/:chatId?/:email? Request delete a user from a chat
 * @apiName DeleteChats
 * @apiGroup Chats
 * 
 * @apiDescription Does not delete the user associated with the required JWT but 
 * instead deletes the user based on the email parameter.  
 * 
 * @apiParam {Number} chatId the chat to delete the user from
 * @apiParam {String} email the email of the user to delete
 * 
 * @apiSuccess {boolean} success true when the name is deleted
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Duplicate Email) {String} message "user not in chat"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.delete("/:chatId/:email", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.chatId || !request.params.email) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        });
    } else {
        next();
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1';
    let values = [request.params.chatId];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                });
            } else {
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            });
        });
}, (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM Members WHERE Email=$1';
    let values = [request.params.email];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                });
            } else {
                request.params.email = result.rows[0].memberid;
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            });
        });
}, (request, response, next) => {
        //validate email exists in the chat
        let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2';
        let values = [request.params.chatId, request.params.email];
    
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
                    message: "SQL Error",
                    error: error
                });
            });

}, (request, response) => {
    //Delete the memberId from the chat
    let insert = `DELETE FROM ChatMembers
                  WHERE ChatId=$1
                  AND MemberId=$2
                  RETURNING *`;
    let values = [request.params.chatId, request.params.email];
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true
            });
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });
    });


module.exports = router;