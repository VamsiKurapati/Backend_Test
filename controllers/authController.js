require('dotenv').config();

const User = require('../models/userModel.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const validUser = await User.findOne({ email });

        if (!validUser) {
            return res.status(404).json({ message : "User Not Found!" });
        }                             
                             
        const hashedPassword = validUser.password;
        const validPassword = await bcrypt.compare(password, hashedPassword);
        if (!validPassword) {
            return res.status(404).json({ message : "Wrong Credentials!" });
        }                                     

        const payload = {
            email: validUser.email,
            id: validUser._id,
            role: validUser.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        const userWithToken = { ...validUser.toObject(), token };

        const { password: pass, ...rest } = userWithToken;
                                                                                              
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
          });

        return res.status(200).json(rest);
    } catch (err) {
        return res.status(err.status || 500).json({ message : `Error in Log in: ${err.message}` });
    }
};

exports.LogOut = async (req, res) => {
    try {
        res.clearCookie('auth_token');
        res.status(200).json('user has been logged out !');
    }
    catch (err) {
       return res.status(err.status || 500).json({ message : `Error in Log out: ${err.message}` });
    }
}
