/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

// Obtain a Pool of DB connections. 
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    }
});

module.exports = pool;
