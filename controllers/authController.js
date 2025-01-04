const User = require('../models/userModel.js')
const bcrypt = require('bcrypt');
require('dotenv').config();
const { errorHandler } = require('../utils/error.js');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
   
    try {
        const { name, role, email, password, phoneNumber, gender } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({ name, role, email, phoneNumber, password: hashedPassword, gender });
        
        const payload = {
            email: email,
            id: user._id
        };
         
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "2d",
        });
       
        const userWithToken = { ...user.toObject(), token };
        
        const { password: pass, ...rest } = userWithToken;
        
        res.cookie('token', token, {
        httpOnly: true,               // Prevent access via JavaScript (helps mitigate XSS)
        secure: false,  // Ensure cookie is only sent over HTTPS in production
        maxAge: 3600000,              // Token expires in 1 hour
        sameSite: 'Nonet',           // Prevent CSRF attacks
       });
        
        res.status(200).json({ message: 'Logged in successfully' });
    } catch (err) {
        console.log(`error in signup ${err.message}`);
        next(err);
    }
};
     
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
       console.log(email,password);

        const validUser = await User.findOne({ email });

        if (!validUser) {
            return next(errorHandler(404, "User Not Found!"));
        }                             
                             
        const hashedPassword = validUser.password;
        const validPassword = await bcrypt.compare(password, hashedPassword);
        if (!validPassword) {
            return next(errorHandler(401, "Wrong Credentials"));
        }                                     

        const payload = {
            email: validUser.email,
            id: validUser._id,
            role: validUser.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.cookie('token', token, {
           httpOnly: true,               // Prevent access via JavaScript (helps mitigate XSS)
           maxAge: 3600000,              // Token expires in 1 hour
           sameSite: 'None',          // Prevent CSRF attacks
       });
       
        res.status(200).json({ message: 'Logged in successfully' });

    } catch (err) {
        console.error(`Error in sign in: ${err.message}`);
        next(err);
    }
};

exports.LogOut = async (req, res, next) => {
    try {
        res.clearCookie('token');
        res.status(200).json('user has been logged out !');
    }
    catch (err) {
        console.log("error in logout")
        next(err);
    }
}
