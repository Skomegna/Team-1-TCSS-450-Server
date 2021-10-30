/**
 * This file has functions to support varification
 * email process.
 */

 
/**
 * Creates random varification code
 * consists of 6 digits.
 * This code will be used to send to user
 * for email varification purpose
 * @returns 
 */
function createCode() {
    let myNumber = Math.floor(Math.random() * 900000) + 100000;
    return myNumber;
}


/**
 * Makes functions accessible along program
 */
module.exports = { 
    createCode
}
