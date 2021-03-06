/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

const pool = require('./sql_conn.js');


/*
 * NOTE: The next two functions are very similar but serve a different purpose.
 *       checkNickname will move onto the next function if
 *       the nickname DOES NOT exist.
 * 
 *       checkNicknameExists will move onto the next function if
 *       the nickname DOES exist. 
 */

/**
 * Checks if the nickname located at request.body.nickname 
 * exists within the database Members table. 
 * 
 * If the username does not exist, call next.
 * If the username exists, send a 400 error { message: "Username exists" }
 * 
 * Can potentially send a 400 error
 * { 
 *      message: "SQL Error",
 *      detail: err.detail
 * }
 */
 function checkNickname(request, response, next) {
    const nickname = request.body.nickname;
    let theValues = [nickname];
    let theQuery = "SELECT Nickname FROM Members WHERE Nickname=$1";
    pool.query(theQuery, theValues)
        .then(result => {
            // query didn't find a nickname so the result array is empty
            if (result.rowCount == 0) {
                next();
            } else {
                response.status(400).send({
                    message: "Username exists"
                });
            }
        })
        .catch((err) => {
            //log the error
            console.log(err.stack);
            response.status(400).send({
                message: "SQL Error",
                detail: err.detail
            });
        });
};



/**
 * Checks if the nickname located at request.body.nickname 
 * exists within the database Members table. 
 * 
 * If the username exists, add the memberId to request.body.otherMemberID 
 * and call next.
 *
 * If the username does not exist, 
 * send a 400 error { message: "Nickname does not exist" }
 * 
 * Can alsp potentially send a 400 error
 * { 
 *      message: "SQL Error",
 *      detail: err.detail
 * }
 */
 function checkNicknameExists(request, response, next) {
    const nickname = request.body.nickname;
    let theValues = [nickname];
    let theQuery = "SELECT MemberId FROM Members WHERE Nickname=$1";
    pool.query(theQuery, theValues)
        .then(result => {
            
            if (result.rowCount == 0) {
                // query didn't find a nickname so the result array is empty
                response.status(400).send({
                    message: "Nickname does not exist"
                });
            } else {
                // nickname found, so move on to next function.
                request.body.otherMemberID = result.rows[0].memberid;
                next();
            }
        })
        .catch((err) => {
            //log the error
            console.log(err.stack);
            response.status(400).send({
                message: "SQL Error",
                detail: err.detail
            });
        });
};



/**
 * Checks if the identifier located at request.body.identifier 
 * exists within the database Members table 
 * in the request.body.identifierType column. 
 * 
 * If the identifier exists, add the memberId to request.body.otherMemberID 
 * and call next.
 * 
 * If the identifier is invalid, 
 * send a 400 error: {message: "Invalid Identifier Type"}
 * 
 * If there are more than 1 accounts with the given identifier, 
 * (case insensitive), send a 400 error: 
 *                      {message: "Duplicate identifiers exist"}
 * 
 * If the identifier does not exist, 
 * send a 400 error: { message: "nickname does not exist" } or
 *                   { message: "firstname does not exist" } or
 *                   { message: "lastname does not exist" } or 
 *                   { message: "email does not exist" }
 * 
 * Can also potentially send a 400 error
 * { 
 *      message: "SQL Error",
 *      detail: err.detail
 * }
 */
function checkIfExists(request, response, next) {
    const identifierType = request.body.identifierType;
    if (identifierType != "nickname" &&
            identifierType != "firstname" &&
            identifierType != "lastname"  &&
            identifierType != "email") {
        // the given identifier type is invalid, so don't try and use it
        response.status(400).send({ 
            message: "Invalid Identifier Type"
        });
    } else {
        // the given identifier type is valid so use it 
        // to check if the identifier is in the members table
        let query = "SELECT MemberId FROM Members WHERE lower(" + 
                request.body.identifierType + ")=$1";
        let values = [request.body.identifier.toLowerCase()];

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    // query didn't find the identifier for the identifierType, 
                    // so the result array is empty
                    response.status(400).send({
                        message: request.body.identifierType + " does not exist"
                    });
                } else if (result.rowCount > 1) {
                    response.status(400).send({
                        message: "Duplicate identifiers exist"
                    });
                
                } else {
                    // identifier found, so set the memberId 
                    // and move on to next function.
                    request.body.otherMemberID = result.rows[0].memberid;
                    next();
                }
            })
            .catch((err) => {
                //log the error
                console.log(err.stack);
                response.status(400).send({
                    message: "SQL Error",
                    detail: err.detail
                });
            });
    }
};




/**
 * Checks if the memberID located at request.body.memberID 
 * exists within the database Members table. 
 * 
 * If the memberID exists, call next.
 * If the username does not exist, 
 * send a 400 error { message: "MemberID does not exist" }
 * 
 * Can potentially send a 400 error
 * { 
 *      message: "SQL Error",
 *      detail: err.detail
 * }
 */
 function checkMemberIDExists(request, response, next) {
    const memberID = request.body.memberID;
    let theValues = [memberID];
    let theQuery = "SELECT memberID FROM Members WHERE memberID=$1";
    pool.query(theQuery, theValues)
        .then(result => {
            
            if (result.rowCount == 0) {
                // query didn't find a memberID so the result array is empty
                response.status(400).send({
                    message: "MemberID does not exist"
                });
            } else {
                // nickname found, so move on to next function.
                next();
            }
        })
        .catch((err) => {
            //log the error
            console.log(err.stack);
            response.status(400).send({
                message: "SQL Error",
                detail: err.detail
            });
        });
};



/**
 * Given a request that has a valid nickname stored at body.nickname, 
 * adds the nickname ID to request.body.otherMemberID that corresponds
 * to the given nickname.
 * 
 * Will send the following response if there is an SQL error
 * Code 400: 
 * {
 *      message: "SQL error", 
 *      error: (the error) 
 * }
 * 
 */
function addMemberID(request, response, next) {
    let query = `SELECT Members.memberID
                  FROM Members
                  WHERE Nickname=$1`;
    let values = [request.body.nickname];
    
    pool.query(query, values)
        .then(result => {
            // get the result from the db and store it
            request.body.otherMemberID = result.rows[0].memberid;
            next();
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });  
}

/**
 * Add a list of contact information objects at request.body.contactInfoList
 * that includes information about each member ID stored 
 * in request.body.memberIDs.
 * 
 * request.body.contactInfoList will contain an array of objects like:
 * [
 *     {
 *         "memberid":"42",
 *         "first":"Charles",
 *         "last":"Bryan",
 *         "nickname": "Big C"
 *      }, 
 *      {
 *         "memberid":"167",
 *         "first":"Austn",
 *         "last":"Attaway",
 *         "nickname": "AustnSauce"
 *       }
 *  ]
 * 
 * 
 * Can potentially send a 400 error
 * { 
 *      message: "SQL Error",
 *      detail: err.detail
 * }
 */ 
function getContactInfo(request, response, next) {

    let memberIDs = request.body.memberIDs;

    // if there aren't IDs, set request.body.contactInfoList 
    // to an empty array and move on.
    // and move onto next function
    if (memberIDs.length === 0) {
        request.body.contactInfoList = [];
        next();
    
    } else {
        let query = "SELECT (memberID, FirstName, LastName, Nickname) "
            + "FROM Members WHERE ";
        for (let i = 0; i < memberIDs.length; i++) {
            query += "memberID=" + memberIDs[i] + " OR ";
        }
        query = query.substring(0, query.length - 3);
        
        pool.query(query)
            .then(result => {
                // now that we have the raw data, format it
                let rawData = result.rows;
                const resultArr = [];

                for (let i = 0; i < rawData.length; i++) {
                    let rowString = rawData[i].row;
                    rowString = rowString.substring(1, rowString.length - 1);
                    let arr = rowString.split(',');
                    
                    let resultObj = {
                        "memberid": arr[0],
                        "first": arr[1],
                        "last": arr[2],
                        "nickname": arr[3]
                    };
                    resultArr[i] = resultObj;
                }

                request.body.contactInfoList = resultArr;
                next();
            })
            .catch(err => {
                // an sql error occurred 
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                });
            });
        }
}

module.exports = {
    checkNickname, 
    checkNicknameExists, 
    checkMemberIDExists, 
    addMemberID, 
    getContactInfo,
    checkIfExists
};