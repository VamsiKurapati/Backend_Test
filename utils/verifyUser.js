const { errorHandler } = require("./error.js");
const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    //const token = req.headers.authorisation;
    const token = req.cookies?.token;
    console.log("Token: ",token);
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
