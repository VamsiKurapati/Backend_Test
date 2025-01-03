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
        
        console.log(token);
        const userWithToken = { ...user.toObject(), token };
        
        const { password: pass, ...rest } = userWithToken;
        
        const options = {
            expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };
        
        res.cookie("token", token, options).status(200).json(rest);
    } catch (err) {
        console.log(`error in signup ${err.message}`);
        next(err);
    }
};
     
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

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
            expiresIn: "2d",
        });

        const userWithToken = { ...validUser.toObject(), token };

        const { password: pass, ...rest } = userWithToken;
                                                                                              
        const options = {
            expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            httpOnly: true
        };

        res.cookie("token", token, options).status(200).json(rest);

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