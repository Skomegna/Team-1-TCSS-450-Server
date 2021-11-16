/*
 * TCSS450 Mobile Applications
 * Fall 2021
 */

/*
 * Visit these links for more information on nodemailer
 * https://nodemailer.com/about/
 * https://www.w3schools.com/nodejs/nodejs_email.asp 
 */

// make sure you add the password to the environmental variables
// similar to the DATABASE_URL and PHISH_DOT_NET_KEY (later section of the lab)

// require nodemailer for sending the email
const nodemailer = require('nodemailer');

// the password stored in a secure .env file
const EMAIL_PASS = process.env.BURNER_EMAIL_PASS;

// the email that will be used to send emails
const EMAIL = 'tcss450.1.no.reply@gmail.com';


/*
 * Sends an email to the given recieverEmail with the
 * given subject name and message.
 */
const sendEmail = (receiverEmail, subject, message) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: EMAIL,
          pass: EMAIL_PASS
        }
    });

    var mailOptions = {
        from: EMAIL,
        to: receiverEmail,
        subject: subject,
        text: message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
};


module.exports = { 
    sendEmail
};