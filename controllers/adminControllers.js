const Locker = require('../models/lockerModel.js')
const User = require('../models/userModel.js')
const bcrypt = require('bcrypt');
require('dotenv').config();
const { errorHandler } = require('../utils/error.js');
const jwt = require('jsonwebtoken');
const mailSender=require('../utils/mailSender')
exports.addStaff = async (req, res, next) => {
    try {
        // if(req.user.role!=='Admin'){
        //     return res.status(501).json("Unauthorized");
        // }
        const { name, role, email, password, phoneNumber, gender } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const  user = await User.create({ name, role, email, phoneNumber, password: hashedPassword, gender });

        const payload = {
            email: email,
            id: user._id
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "2d",
        });

        const userWithToken = { ...user.toObject(), token };

        const { password: pass, ...rest } = userWithToken;

        const options = {
            expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };
        await mailSender(
            email,
            "Your credentials for login from Draconx are :  ",
            `email : ${email}
            password : ${password}
            `
        );

        res.cookie("token", token, options).status(200).json(rest);
    } catch (err) {
        console.log(`error in adding staff ${err.message}`);
        next(err);
    }
};

exports.editStaff = async (req, res, next) => {
    try {
        // Get the staff ID from request parameters
        // if(req.user.role!=='Admin'){
        //     return res.status(501).json("Unauthorized");
        // }
        const { id } = req.body;
        // console.log(id)
        // Find the user by ID
        let user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract fields from the request body
        const { name, role, email, password, phoneNumber, gender } = req.body;

        // Update only the fields that are provided
        if (name &&  name.length!==0) user.name = name;
        if (role && role.length!==0) user.role = role;
        if (email &&  email.length!==0) user.email = email;
        if (phoneNumber && phoneNumber.length!==0) user.phoneNumber = phoneNumber;
        if (gender && gender.length!==0) user.gender = gender;

        // Hash the password if provided                       
        if (password && password.length!==0) {
            user.password = await bcrypt.hash(password, 10);
        }

        // Save the updated user details                          
        await user.save();

        // Create a new token with updated information          
        const payload = { email: user.email, id: user._id,role: user.role};
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2d" });

        const options = {
            expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };

        res.cookie("token", token, options).status(200).json({
            message: 'User updated successfully',
            user: { ...user.toObject(), token },
        });
    } catch (err) {
        console.log(`Error in updating staff: ${err.message}`);
        next(err);
    }
};

exports.viewStaffDetails = async (req, res, next) => {
    try {
        console.log(req.cookies.token)
        console.log(req.user)
        const { id } = req.body;

        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User Details fetched successfully',
            user: user
        }); 
    } catch (err) {
        console.log(`Error in updating staff: ${err.message}`);
        next(err);
    }
};


exports.viewAllStaff = async (req, res, next) => {
    try {
        console.log(req.cookies.token);
        console.log("in");
        let users = await User.find({ role: "Staff" });
        if (!users) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Users  fetched successfully',
            users: users
        });
    } catch (err) {
        console.log(`Error in updating staff: ${err.message}`);
        next(err);
    }
};

exports.removeStaff = async (req, res, next) => {
    if(req.user.role!=='Admin'){
        return res.status(501).json("Unauthorized");
    }
    console.log("in");
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Staff ID is required" });
        }

        const deletedStaff = await User.findByIdAndDelete(id);
        if (!deletedStaff) {
            return res.status(404).json({ message: "Staff not found" });
        }
        res.status(200).json({ message: "Staff member removed successfully" });
    } catch (err) {
        console.log(`error in removing staff: ${err.message}`);
        res.status(500).json({ message: `Error removing staff: ${err.message}` });
        next(err);
    }
};


exports.addLocker = async (req, res, next) => {
    try {
        const { LockerType, LockerNumber, LockerCodeCombinations, LockerPrice3Month, LockerPrice6Month, LockerPrice12Month, availableForGender , LockerSerialNumber} = req.body;
        console.log({ LockerType, LockerNumber, LockerCodeCombinations, LockerPrice3Month, LockerPrice6Month, LockerPrice12Month, availableForGender , LockerSerialNumber} )
        const locker = await Locker.create({ LockerType, LockerNumber, LockerCodeCombinations, LockerPrice3Month, LockerPrice6Month, LockerPrice12Month, availableForGender, LockerSerialNumber });
        
        locker.LockerCode=LockerCodeCombinations[0];
        await locker.save();
        
        return res.status(200).json({
            message: "Locker Created Successfully",
            data: locker
        });
    } catch (err) {
        console.log(`error in adding ${err.message}`);
        next(err);
    }
    // LockerType, LockerNumber, LockerCode, LockerPrice3Month, LockerPrice6Month, LockerPrice12Month, availableForGender 
}

exports.addMultipleLocker = async (req, res, next) => {
    try {
        const lockersData = req.body;

        // Check if lockersData is an array
        if (!Array.isArray(lockersData)) {
            return res.status(400).json({
                message: "Invalid input: Expected an array of locker objects"
            });
        }

        // Update each locker object with LockerCode from LockerCodeCombinations[0]
        const updatedLockersData = lockersData.map((lockerData) => {
            if (lockerData.LockerCodeCombinations && lockerData.LockerCodeCombinations.length > 0) {
                lockerData.LockerCode = lockerData.LockerCodeCombinations[0];
            }
            return lockerData;
        });

        // Insert all updated locker objects at once
        const newLockers = await Locker.insertMany(updatedLockersData);

        return res.status(200).json({
            message: "Lockers Created Successfully",
            data: newLockers
        });
    } catch (err) {
        console.log(`Error in creating lockers: ${err.message}`);
        next(err);
    }
};

// exports.addMultipleLocker = async (req, res, next) => {
//     try {
//         const lockersData = req.body.data;

//         // Update each locker object with LockerCode from LockerCodeCombinations[0]
//         const updatedLockersData = lockersData.map((lockerData) => {
//             lockerData.LockerCode = lockerData.LockerCodeCombinations[0];
//             return lockerData;
//         });

//         // Insert all updated locker objects at once
//         const newLockers = await Locker.insertMany(updatedLockersData);

//         return res.status(200).json({
//             message: "Lockers Created Successfully",
//             data: newLockers
//         });
//     } catch (err) {
//         console.log(`Error in creating lockers: ${err.message}`);
//         next(err);
//     }
// };

// exports.addMultipleLocker = async (req, res, next) => {
//     try {
//         const lockers = req.body.data;
//         console.log("adding multiple lockers")
//         console.log(lockers);
//         const newLockers = await Locker.insertMany(lockers);
        
//         return res.status(200).json({
//             message: "Lockers Created Successfully",
//             data: newLockers
//         });
//     } catch (err) {
//         console.log(`Error in creating lockers: ${err.message}`);
//         next(err);
//     }
// };