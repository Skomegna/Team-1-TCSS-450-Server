// Creates random varification code
function createCode() {
    let myNumber = Math.floor(Math.random() * 900000) + 100000;
    return myNumber;
}



module.exports = { 
    createCode
}
