/*
 * TCSS450 Mobile Applications
 * Fall 2021
 * 
 * Contains helper functions that can be inserted in 
 * endpoint function chains that check the validity of given parameters
 * including email, password, first name, last name, and nickname.
 */


/**
 * Given recive user's email stored at request.body.email, 
 * will sent 400 errors if the email is not at least 3 characters, 
 * contains whitespace, or does not have an '@' symbol. If all 
 * requirements are met, move onto the next function.
 */
function checkEmail(request, response, next) {
    const userEmail = (request.body.email);
    
    var atSignRegex = /@/;
    var whiteSpaceRegex = /\s/;
    var atSignChecker = userEmail.match(atSignRegex);
    var whiteSpaceChecker = userEmail.match(whiteSpaceRegex);

    if(userEmail.length < 3) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Email must have at least 3 digits"
        });
    } 
    else if(atSignChecker == null) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Email must contain @ symbol"
        });
    } 
    else if(whiteSpaceChecker != null) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Email must have no whitespace"
        });
    }
    else { 
        next();
    }

}

/**
 * Given recive user's password stored at request.body.password, 
 * will sent 400 errors if the password contains less than 8 characters, 
 * the password does not have at least one special character, 
 * the password does not contain at least 1 digit or
 * the password does not contain at least one letter. 
 * If all requirements are met, move onto the next function.
 */
function checkPassword(request, response, next) {
    const userPassword = request.body.password;

    var specialCharacterRegex = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
    var letterRegex = /[a-zA-Z]/;
    var digitRegex = /[0-9]/;

    if(userPassword.length < 8) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Password must have at least 8 characters"
        });
    }
    else if(userPassword.match(specialCharacterRegex) == null) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Password must contain at least one special character"
        });
    }
    else if(userPassword.match(letterRegex) == null) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Password must contain at least 1 letter"
        });
    }
    else if(userPassword.match(digitRegex) == null) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Password must contain at least 1 digit"
        });
    }
    else { 
        next();
    }
}

/**
 * Given the user's first name, last name, and nickname stored at 
 * request.body.first, request.body.last, and request.body.nickname 
 * respectively, sends a 400 error if any of the fields are less than 
 * 2 characters. If all Strings pass, move onto the next function.
 */
function checkNames(request, response, next) {
    const userFirstName = request.body.first;
    const userLastName = request.body.last;
    const userNickname = request.body.nickname;

    if(userFirstName.length < 2) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "First name must have at least 2 digits"
        });
        
    }
    else if(userLastName.length < 2) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Last name must have at least 2 digits"
        });
    }
    else if(userNickname.length < 2 ) {
        response.status(400).send({
            message: "Invalid Parameter",
            detail: "Nickname must have at least 2 digits"
        });
    }
    else {
        next();
    }
}

module.exports = {
    checkEmail,
    checkPassword,
    checkNames
};