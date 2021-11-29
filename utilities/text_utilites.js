/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

//how to test?
//calling the right param?

/**
 * recive user's email from server, set up two regex to compare for 
 * at sign and white space, if at sign is missing or 
 */
function checkEmail(request, response, next){
    const userEmail = (request.body.email);
    
    var atSignRegex = /@/;
    var whiteSpaceRegex = /\s/;
    var atSignChecker = userEmail.match(atSignRegex);
    var whiteSpaceChecker = userEmail.match(whiteSpaceRegex);
    
    if(userEmail.length <= 3){
        //alert?
        response.status(400).send({
            message: "Email must longer than 3 digits"
        });
    } 
    else if(atSignChecker != null){
        response.status(400).send({
            message: "Email must must contain @"
        });
    } 
    else if(whiteSpaceChecker == null){
        response.status(400).send({
            message: "Email must have no whitespace "
        });
    } 
    //should it be next?
    else{ next();}

}

function checkPassword(request, response, next){
    const userPassword = request.body.password;

    var specialCharacterRegex = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
    var digitLetterRegex = /\w+/;

    if(userPassword.length < 8){
        response.status(400).send({
            message: "Password must be longer than or equal to 8 digit"
        });
    }
    else if(userPassword.test(specialCharacterRegex) == null){
        response.status(400).send({
            message: "Password must contain at least one special character"
        });
    }

    else if(userPassword.test(digitLetterRegex) == null){
        response.status(400).send({
            message: "Password must contain at least 1 digit or letter"
        });
    }
    else{ next();}
}

function checkNames(request, response, next){
    const userFirstName = request.body.first;
    const userLastName = request.body.last;
    const userNickname = request.body.nickname;

    if(userFirstName.length < 2
        ||userLastName.length < 2
        ||userNickname.length < 2 ){
            response.status(400).send({
                message: "It must be longer than 1 digits"
            });
        }
        else{next();}
}

module.exports = {
    checkEmail,
    checkPassword,
    checkNames
};