const user = require('../services/userService');
const auth = require('../services/authService');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const validator = require('validator')

const winston = require("winston")
const fs = require("fs")
const filename = 'created-logfile.log'
try { fs.unlinkSync(filename); }
catch (ex) { }
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename })
    ]
});

exports.processLogin = (req, res, next) => {
    logger.log('info', 'processLogin running.')
    console.log('processLogin running.');
    let email = req.body.email;
    let password = req.body.password;
    try {
        auth.authenticate(email, function (error, results) {
            if (error) {
                let message = 'Credentials are not valid.';
                //return res.status(500).json({ message: message });
                //If the following statement replaces the above statement
                //to return a JSON response to the client, the SQLMap or
                //any attacker (who relies on the error) will be very happy
                //because they relies a lot on SQL error for designing how to do 
                //attack and anticipate how much "rewards" after the effort.
                //Rewards such as sabotage (seriously damage the data in database), 
                //data theft (grab and sell). 
                return res.status(500).json({ message: error });
            } else {
                if (results.length == 1) {
                    if ((password == null) || (results[0] == null)) {
                        return res.status(500).json({ message: 'login failed' });
                    }
                    if (bcrypt.compareSync(password, results[0].user_password) == true) {
                        let data = {
                            user_id: results[0].user_id,
                            role_name: results[0].role_name,
                            token: jwt.sign({ id: results[0].user_id, role: results[0].role_name }, config.JWTKey, {
                                expiresIn: 86400 //Expires in 24 hrs
                            })
                        }; //End of data variable setup
                        return res.status(200).json(data);
                    } else {
                        // return res.status(500).json({ message: 'Login has failed.' });
                        return res.status(500).json({ message: error });
                    } //End of passowrd comparison with the retrieved decoded password.
                } //End of checking if there are returned SQL results
            }
        })
    } catch (error) {
        return res.status(500).json({ message: error });
    } //end of try
};

exports.processRegister = (req, res, next) => {
    console.log('processRegister running.');
    let fullName = req.body.fullName;
    let email = req.body.email;
    let password = req.body.password;

    var regexFullname = /^[a-zA-Z\s,']+$/gm

    var validatedFullName = regexFullname.test(fullName)
    var validatedEmail = validator.isEmail(email)

    if (validatedFullName == true && validatedEmail == true) {
        bcrypt.hash(password, 10, async (err, hash) => {
            if (err) {
                console.log('Error on hashing password');
                return res.status(500).json({ statusMessage: 'Unable to complete registration' });
            } else {
                results = user.createUser(fullName, email, hash, function (results, error) {
                    if (results != null) {
                        console.log(results);
                        return res.status(200).json({ statusMessage: 'Completed registration.' });
                    }
                    else {
                        console.log('processRegister method : callback error block section is running.');
                        console.log(error, '==================================================================');
                        return res.status(500).json({ statusMessage: 'Unable to complete registration' });
                    }
                });//End of anonymous callback function
            }
        });
    } else {
        console.log('processRegister method : callback error block section is running.');
        console.log(error, '==================================================================');
        return res.status(500).json({ statusMessage: 'Unable to complete registration' });
    }
}; // End of processRegister