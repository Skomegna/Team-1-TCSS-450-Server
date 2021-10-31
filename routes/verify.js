//express is the framework we're going to use to handle requests
const express = require('express')
//Create a new instance of express router
var router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided


/**
 * @api {post} /verify Request an message echo with a parameter 
 * @apiName PostVerify
 * @apiGroup Verify
 * 
 * @apiParam {String} Account email
 * 
 * @apuParam {Int} 6 Digit Verification Code 
 * 
 * @apiSuccess {String} Thank you for verification message.
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 */ 
router.post("/", (request, response, next) => {
    if (isStringProvided(request.body.email) && isStringProvided(request.body.code)) {
        const email = request.body.email;
        const code = request.body.code;
        next();
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }
}, (request, response, next) => {
    


}

)

module.exports = router