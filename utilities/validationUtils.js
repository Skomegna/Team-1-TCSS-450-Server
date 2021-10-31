
/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
let isStringProvided = (param) => 
    param !== undefined && param.length > 0


/**
 * Creates random varification code
 * consists of 6 digits.
 * This code will be used to send to user
 * for email varification purpose
 * @returns 
 */
 function createCode() {
  let myNumber = (Math.floor(Math.random() * 900000) + 100000);
  return myNumber;
}

function storeCode(theEmail, theCode) {
  
  let theCodeQuery = "INSERT INTO VerificationCode (Email, Code) VALUES ($1, $2)" 
  let theValues = [email, theCode];
    pool.query(theCodeQuery, theValues)
      .then (result => {
          response.status(201).send({
            success: true
          })        
      })
      .catch((error) => {
        //log the error
        // console.log(error)
        console.log(err.stack)
        response.status(400).send({
        message: err.detail
      })
  })
}
  
module.exports = { 
  createCode,
  isStringProvided,
  storeCode
}