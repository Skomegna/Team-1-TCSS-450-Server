/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

const Pushy = require('pushy');

// Plug in your Secret API Key 
const pushyAPI = new Pushy(process.env.PUSHY_API_KEY);

/* 
 * Sends a message pushy notification to a specific 
 * client specified by the token
 */
function sendMessageToIndividual(token, message) {
    
    // the data to send
    var data = {
        "type": "msg",
        "message": message,
        "chatid": message.chatid
    }
    sendPushy(token, data);
}

/*
 * Sends a new contact request notification to a specific
 * client specified by the token.
 * 
 * Use this whenever someone sends or recieves a new contact request.
 */
function sendNewContactRequestNotif(token, toMemberId, fromMemberId, 
                                    fromNickname) {
    const data = {
        "type": "newContactRequest",
        "toId": toMemberId,
        "fromId": fromMemberId,
        "fromNickname": fromNickname
    };

    sendPushy(token, data);
}


/*
 * Sends a contact request response notification to a specific
 * client specified by the token. 
 */
function sendContactRequestResponseNotif(token, toMemberId, fromMemberId, 
                                         fromNickname, isAccept) {
    const data = {
        "type": "contactRequestResponse",
        "toId": toMemberId,
        "fromId": fromMemberId,
        "fromNickname": fromNickname,
        "isAccept":  isAccept
    };
    sendPushy(token, data);                                      
}

/*
 * Sends a contact  notification to a specific client specified by the token 
 * notifying that someone deleted their contact
 */
function sendContactDeletionNotif(token, deletedMemberId, deleterMemberId, 
                                  deleterNickname) {
    const data = {
        "type": "contactDeleted",
        "deletedId": deletedMemberId,
        "deletorId": deleterMemberId,
        "fromNickname": deleterNickname,   
    };
    console.log(data);
    sendPushy(token, data);                                      
}

/* 
 * Sends a pushy notification to the account corresponding to the given token
 * that includes the given data
 */ 
function sendPushy(token, data) {

    // Send push notification via the Send Notifications API 
    // https://pushy.me/docs/api/send-notifications 
    pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
        // Log errors to console 
        if (err) {
            return console.log('Fatal Error', err);
        }

        // Log success 
        console.log('Push sent successfully! (ID: ' + id + ')')
    })
}

module.exports = {
    sendMessageToIndividual,
    sendNewContactRequestNotif, 
    sendContactRequestResponseNotif, 
    sendContactDeletionNotif
}

//add other "sendTypeToIndividual" functions here. Don't forget to export them


// notify of a message (DONE)
// notify of a contact request (sent recieved) DONE  (accepted, rejected) DONE
// notify of a change in contacts (delete) (DONE)


// CHECKLIST: 

// contact request sent              DONE
// contact request recieved          DONE
// contact request responded to      DONE
// contact request recieved response DONE
// contact deleted you               

