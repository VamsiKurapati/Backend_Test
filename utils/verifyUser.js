const { errorHandler } = require("./error.js");
const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    console.log(req.cookies);
    
    let token = req.cookies.auth_token;
    
    // if (req.headers.authorization) {
    //     token = req.headers.authorization.split(' ')[1];
    // } else if (req.cookies && req.cookies.auth_token) {
    //     token = req.cookies.auth_token;
    // }
    
    if (!token) {
        return next(errorHandler(401, "Unauthorized: Token is empty or incorrect"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return next(errorHandler(403, `Forbidden: ${err}`));

        req.user = user;
        next();
    });
};

module.exports = verifyToken;