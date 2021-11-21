/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

// use express to handle requests
const express = require('express');

// access the connection to Heroku Database
const pool = require('../utilities/exports').pool;

const router = express.Router();

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided;

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

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
 * 
 * @apiParamExample {json} Request-Body-Example:
 *     {
 *         "name": "Austn, Parker, Steve, Alex, and Chris",
 *         "memberIds": [542, 543, 544, 545];
 *     }
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {Number} chatId the generated chatId
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Invalid memberID) {String} message "A given memberID does not exist"
 * 
 * @apiError (400: Member Insertion Error) {String} message "Error occurred while adding members"
 * 
 * @apiError (400: SQL Error) {String} message "SQL Error"
 * @apiError (400: SQL Error) {String} error the error details
 * 
 * 
 * @apiUse JSONError
 */ 
router.post("/", (request, response, next) => {
    // make sure data is given
    if (!isStringProvided(request.body.name)
            || request.body.memberIds == undefined) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else {
        next();
    };
}, (request, response, next) => {
    // check that all member IDs are valid
    let memberIds = request.body.memberIds;

    // call next if the user only wants to create a chat with themself
    if (memberIds.length == 0) {
        next();
    } else {
        // concatenate the query
    let query = "SELECT memberid from Members WHERE ";
    for (let i = 0; i < memberIds.length; i++) {
        query += "memberid=" + memberIds[i];
        
        if (i + 1 != memberIds.length) {
            // no more ids to check, so don't include ' OR '
            query += " OR ";
        }
    }

    pool.query(query)
        .then(result => {
            
            // if the length or the rows we get back is 
            // the same as the memberIds array,
            // we know that all memberIds are valid. 
            if (result.rowCount === memberIds.length) {
                next();
            } else {
                response.status(400).send({
                    message: "A given memberID does not exist"
                });
            }
            
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });

    }

    
}, (request, response, next) => {
    // insert the new chat into the chats table 
    let query = "INSERT INTO Chats(Name) VALUES (\'" 
            + request.body.name + "\') RETURNING ChatId";

    pool.query(query)
        .then(result => {
            request.body.newChatId = result.rows[0].chatid;
            next();
            
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });

}, (request, response, next) => {
    // add all of the members to the new chat
    let newChatId = request.body.newChatId;
    let memberIds = request.body.memberIds;
    let memberIdLength = request.body.memberIds.length
    
    let query = "INSERT INTO ChatMembers (chatid, memberid) VALUES ";
    
    for (let i = 0; i < memberIdLength; i++) {
        query += "(" + newChatId + ", " + memberIds[i] + "), ";
    }
    query += "(" + newChatId + ", " + request.decoded.memberid + ")";

    // make a custom query string if you are only adding yourself to the chat
    if (memberIds.length == 0) {
        query = "INSERT INTO ChatMembers (chatid, memberid) VALUES (" 
                + newChatId + ", " + request.decoded.memberid + ")";
    }
console.log(query);

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
    
}, (request, response) =>{
    response.send({
         success: true,
         chatID: request.body.newChatId,
         chatName: request.body.name
    });
});


/**
 * @api {put} /chats/:chatId? Request add a user to a chat
 * @apiName PutChats
 * @apiGroup Chats
 * 
 * @apiDescription Adds the user associated with the required JWT. 
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to add the user to
 * 
 * @apiSuccess {boolean} success true when the name is inserted
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Duplicate Email) {String} message "user already joined"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.put("/:chatId/", (request, response, next) => {
    //validate on empty parameters
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
            };
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            });
        });
        //code here based on the results of the query
}, (request, response, next) => {
    //validate email exists 
    let query = 'SELECT * FROM Members WHERE MemberId=$1';
    let values = [request.decoded.memberid];

console.log(request.decoded);

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                });
            } else {
                //user found
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            });
        });
}, (request, response, next) => {
        //validate email does not already exist in the chat
        let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2';
        let values = [request.params.chatId, request.decoded.memberid];

        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    response.status(400).send({
                        message: "user already joined"
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
    //Insert the memberId into the chat
    let insert = `INSERT INTO ChatMembers(ChatId, MemberId)
                  VALUES ($1, $2)
                  RETURNING *`;
    let values = [request.params.chatId, request.decoded.memberid];
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