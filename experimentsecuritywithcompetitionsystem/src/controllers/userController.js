const userManager = require('../services/userService');
const fileDataManager = require('../services/fileService');
const config = require('../config/config');
const { default: validator } = require('validator');
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

exports.processDesignSubmission = (req, res, next) => {
    logger.log('info', 'processDesignSubmission running.');
    let designTitle = req.body.designTitle;
    let designDescription = req.body.designDescription;
    logger.log('info', 'Design Title: ' + designTitle + '\nDesign Description: ' + designDescription)

    var validateDesignTitle = /^[a-zA-Z0-9\s.,]+$/gm
    var validateDesignDescription = /^[a-zA-Z0-9\s.,]+$/gm

    let userId = req.body.userId;
    let file = req.body.file;

    if (validateDesignTitle.test(designTitle) && validateDesignDescription.test(designDescription)) {
        fileDataManager.uploadFile(file, async function (error, result) {
            console.log('check result variable in fileDataManager.upload code block\n', result);
            console.log('check error variable in fileDataManager.upload code block\n', error);
            let uploadResult = result;
            if (error) {
                let message = 'Unable to complete file submission.';
                res.status(500).json({ message: message });
                res.end();
            } else {
                //Update the file table inside the MySQL when the file image
                //has been saved at the cloud storage (Cloudinary)
                let imageURL = uploadResult.imageURL;
                let publicId = uploadResult.publicId;
                console.log('check uploadResult before calling createFileData in try block', uploadResult);
                try {
                    let result = await fileDataManager.createFileData(imageURL, publicId, userId, designTitle, designDescription);
                    console.log('Inspert result variable inside fileDataManager.uploadFile code');
                    console.log(result);
                    if (result) {
                        let message = 'File submission completed.';
                        res.status(200).json({ message: message, imageURL: imageURL });
                    }
                } catch (error) {
                    let message = 'File submission failed.';
                    res.status(500).json({
                        message: message
                    });
                }
            }
        })
    } else {
        let message = 'Unable to complete file submission.';
        res.status(500).json({ message: message });
        res.end();
    }

}; //End of processDesignSubmission

exports.processGetSubmissionData = async (req, res, next) => {
    let pageNumber = req.params.pagenumber;
    let search = req.params.search;
    let userId = req.body.userId;
    try {
        let results = await fileDataManager.getFileData(userId, pageNumber, search);
        console.log('Inspect result variable inside processGetSubmissionData code\n', results);
        if (results) {
            var jsonResult = {
                'number_of_records': results[0].length,
                'page_number': pageNumber,
                'filedata': results[0],
                'total_number_of_records': results[2][0].total_records
            }
            return res.status(200).json(jsonResult);
        }
    } catch (error) {
        let message = 'Server is unable to process your request.';
        return res.status(500).json({
            message: error
        });
    }
}; //End of processGetSubmissionData

exports.processGetSubmissionsbyEmail = async (req, res, next) => {
    logger.log('info', 'processGetSubmissionsByEmail running.');
    let pageNumber = req.params.pagenumber;
    let search = req.params.search;
    let userId = req.body.userId;
    logger.log('info', 'User ID: ' + userId + '\nSearch: ' + search);
    
    try {
        //Need to search and get the id information from the database
        //first. The getOneuserData method accepts the userId to do the search.
        let userData = await userManager.getOneUserDataByEmail(search);
        console.log('Results in userData after calling getOneUserDataByEmail');
        console.log(userData);
        if (userData) {
            let results = await fileDataManager.getFileDataByUserId(userData[0].user_id, pageNumber);
            console.log('Inspect result variable inside processGetSubmissionsbyEmail code\n', results);
            if (results) {
                var jsonResult = {
                    'number_of_records': results[0].length,
                    'page_number': pageNumber,
                    'filedata': results[0],
                    'total_number_of_records': results[2][0].total_records
                }
                return res.status(200).json(jsonResult);
            }//Check if there is any submission record found inside the file table
        }//Check if there is any matching user record after searching by email
    } catch (error) {
        let message = 'Server is unable to process your request.';
        return res.status(500).json({
            message: error
        });
    }
}; //End of processGetSubmissionsbyEmail

exports.processGetUserData = async (req, res, next) => {
    logger.log('info', 'processGetUserData running.');
    let pageNumber = req.params.pagenumber;
    let search = req.params.search;
    logger.log('info', 'Page Number: ' + pageNumber + '\nSearch: ' + search);

    try {
        let results = await userManager.getUserData(pageNumber, search);
        console.log('Inspect result variable inside processGetUserData code\n', results);
        if (results) {
            var jsonResult = {
                'number_of_records': results[0].length,
                'page_number': pageNumber,
                'userdata': results[0],
                'total_number_of_records': results[2][0].total_records
            }
            return res.status(200).json(jsonResult);
        }
    } catch (error) {
        let message = 'Server is unable to process your request.';
        return res.status(500).json({
            message: error
        });
    }
}; //End of processGetUserData

exports.processGetOneUserData = async (req, res, next) => {
    let recordId = req.params.recordId;

    try {
        let results = await userManager.getOneUserData(recordId);
        console.log('Inspect result variable inside processGetOneUserData code\n', results);
        if (results) {
            var jsonResult = {
                'userdata': results[0],
            }
            return res.status(200).json(jsonResult);
        }
    } catch (error) {
        let message = 'Server is unable to process your request.';
        return res.status(500).json({
            message: error
        });
    }
}; //End of processGetOneUserData


exports.processUpdateOneUser = async (req, res, next) => {
    console.log('processUpdateOneUser running');
    //Collect data from the request body 
    let recordId = req.body.recordId;
    let newRoleId = req.body.roleId;
    logger.log('info', 'Record ID: ' + recordId + '\nNew Role ID: ' + newRoleId);
    try {
        results = await userManager.updateUser(recordId, newRoleId);
        console.log(results);
        return res.status(200).json({ message: 'Completed update' });
    } catch (error) {
        console.log('processUpdateOneUser method : catch block section code is running');
        console.log(error, '=======================================================================');
        return res.status(500).json({ message: 'Unable to complete update operation' });
    }
}; //End of processUpdateOneUser

exports.processGetOneDesignData = async (req, res, next) => {
    let recordId = req.params.fileId;

    try {
        let results = await userManager.getOneDesignData(recordId);
        console.log('Inspect result variable inside processGetOneFileData code\n', results);
        if (results) {
            var jsonResult = {
                'filedata': results[0],
            }
            return res.status(200).json(jsonResult);
        }
    } catch (error) {
        let message = 'Server is unable to process the request.';
        return res.status(500).json({
            message: error
        });
    }
}; //End of processGetOneDesignData

exports.processSendInvitation = async (req, res, next) => {
    logger.log('info', 'processSendInvitation running.');
    let userId = req.body.userId;
    let recipientEmail = req.body.recipientEmail;
    let recipientName = req.body.recipientName;

    var validatedEmail = validator.isEmail(recipientEmail)
    var validatedName = /^[a-zA-Z0-9\s,]+$/gm

    logger.log('userController processSendInvitation method\'s received values');
    logger.log('info', 'userID: ' + userId);
    logger.log('info', 'Recipient Email: ' + recipientEmail);
    logger.log('info', 'Recipient Name: ' + recipientName);

    try {
        if (validatedEmail && validatedName.test(recipientName)) {
            //Need to search and get the user's email information from the database
            //first. The getOneuserData method accepts the userId to do the search.
            let userData = await userManager.getOneUserData(userId);
            console.log(userData);
            let results = await userManager.createOneEmailInvitation(userData[0], recipientName, recipientEmail);
            if (results) {
                var jsonResult = {
                    result: 'Email invitation has been sent to ' + recipientEmail + ' ',
                }
                return res.status(200).json(jsonResult);
            }
        } else {
            let message = 'Server is unable to process the request.';
            return res.status(500).json({
                message: message,
            });
        }
    } catch (error) {
        console.log(error);
        let message = 'Server is unable to process the request.';
        return res.status(500).json({
            message: message,
            error: error
        });
    }
}; //End of processSendInvitation

exports.processUpdateOneDesign = async (req, res, next) => {
    console.log('processUpdateOneFile running');
    //Collect data from the request body 
    let fileId = req.body.fileId;
    let designTitle = req.body.designTitle;
    let designDescription = req.body.designDescription;

    logger.log('info', 'Design Title: ' + designTitle + '\nDesign Description: ' + designDescription)

    var validateDesignTitle = /^[a-zA-Z0-9\s.,]+$/gm
    var validateDesignDescription = /^[a-zA-Z0-9\s.,]+$/gm

    try {
        if (validateDesignTitle.test(designTitle) && validateDesignDescription.test(designDescription)) {
            results = await userManager.updateDesign(fileId, designTitle, designDescription);
            console.log(results);
            return res.status(200).json({ message: 'Completed update' });
        }
    } catch (error) {
        console.log('processUpdateOneUser method : catch block section code is running');
        console.log(error, '=======================================================================');
        return res.status(500).json({ message: 'Unable to complete update operation' });
    }
}; //End of processUpdateOneDesign