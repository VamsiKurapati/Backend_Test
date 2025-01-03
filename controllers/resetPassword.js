const mailSender = require("../utils/mailSender.js");
const OTP = require("../models/OTP.js");
const bcrypt = require("bcrypt");
const User = require("../models/userModel.js");
function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

console.log(generateOTP());

exports.getOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist" });
        }

        const otp = generateOTP();
        console.log(otp);
        const newOTP = await OTP.create({ email, otp });
        await mailSender(email, "Password Reset", `your otp from Dev-forge Software solutions for resetting password is ${otp}.`);

        return res.status(200).json({
            message: "OTP sent successfully",
            // data: otp
        });
    } catch (err) {
        console.error(`Error in Sending OTP: ${err.message}`);
        next(err);
    }
};
exports.validateOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return res.status(404).json({ message: "OTP not found. Please request a new OTP." });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP. Please check and try again." });
        }

        await OTP.deleteOne({ email });

        return res.status(200).json({
            message: "OTP successfully verified",
        });
    } catch (err) {
        console.error(`Error in resetPassword: ${err.message}`);
        next(err);
    }
};
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email, and new password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        await OTP.deleteOne({ email });

        return res.status(200).json({
            message: "Password reset successfully",
        });
    } catch (err) {
        console.error(`Error in resetPassword: ${err.message}`);
        next(err);
    }
};
