const config = require('../config/config');
const jwt = require('jsonwebtoken');

const verifyAdminBefUpdate = {
    verifyTokenUserID: function (req, res, next) {
        // logger.info("verifyTokenUserID middleware called");
        let token = req.headers['authorization'];
        let roleName = req.headers['role']
        roleName = roleName.toString()
        res.type('json');

        if (!token || !token.includes("Bearer ") || roleName == "user") {
            console.log("Unauthorized Access Attempt Was Made, No Token")
            res.status(403);
            res.send(`{"Message":"Not Authorized"}`);
        }
        else {
            token = token.split('Bearer ')[1];
            jwt.verify(token, config.JWTKey, function (err, decoded) {
                if (err) {
                    console.log("Unauthorized Access Attempt Was Made, Invalid Token")
                    res.status(403);
                    res.send(`{"Message":"Not Authorized"}`);
                } else {
                    req.body.userId = decoded.id;
                    req.role = decoded.role;
                    next();
                }
            })
        }
    }
}

module.exports = verifyAdminBefUpdate
