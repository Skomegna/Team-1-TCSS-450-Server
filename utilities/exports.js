/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

//Get the connection to Heroku Database
const pool = require('./sql_conn.js');

//Get the crypto utility functions
const credUtils = require('./credentialingUtils');
const generateHash = credUtils.generateHash;
const generateSalt = credUtils.generateSalt;

//validation tools
const validation = require('./validation_utilities.js');

const weatherChecker = require('./weatherHelper.js');

// database tools
const database = require('./database_utilities.js');

const sendEmail = require('./email.js').sendEmail;

// pushy tools
let pushyTools = require('./pushy_utilities.js')

module.exports = { 
    pool, generateHash, generateSalt, validation, database, sendEmail, weatherChecker, pushyTools
};