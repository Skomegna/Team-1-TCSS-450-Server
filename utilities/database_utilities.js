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
                message: "Other error, see detail",
                detail: err.detail
            });
        });
};

/**
 * Checks if the nickname located at request.body.nickname 
 * exists within the database Members table. 
 * 
 * If the username exists, call next.
 * If the username does not exist, 
 * send a 400 error { message: "Nickname does not exist" }
 */
 function checkNicknameExists(request, response, next) {
    const nickname = request.body.nickname;
    let theValues = [nickname];
    let theQuery = "SELECT Nickname FROM Members WHERE Nickname=$1";
    pool.query(theQuery, theValues)
        .then(result => {
            
            if (result.rowCount == 0) {
                // query didn't find a nickname so the result array is empty
                response.status(400).send({
                    message: "Nickname does not exist"
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
                message: "Other error, see detail",
                detail: err.detail
            });
        });
};

module.exports = {
    checkNickname, checkNicknameExists
};
