const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");

exports.viewProfile = async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await User.findById(userId, "name email password phoneNumber");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Details fetched successfully",
            data: {
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (err) {
        console.error(`Error in resetPassword: ${err.message}`);
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { userId, name, email, password, phone } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phoneNumber = phone;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (err) {
        console.error(`Error in updating Profile: ${err.message}`);
        next(err);
    }
};
