require('dotenv').config();

const Locker = require('../models/lockerModel.js')
const User = require('../models/userModel.js')
const bcrypt = require('bcrypt');
const mailSender=require('../utils/mailSender')

exports.addStaff = async (req, res) => {
    try {
        const { name, role, email, password, phoneNumber, gender } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const  user = await User.create({ name, role, email, phoneNumber, password: hashedPassword, gender });
        
        const { password: pass, ...rest } = user;
        
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
      
                <div style="text-align: center; margin-bottom: 20px;">
                    <img 
                    src="${process.env.IMG_LINK}" 
                    alt="Company Logo" 
                    style="width: err.status || 500px; height: auto;" 
                    />
                </div>

                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    Dear ${name},
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    We are excited to inform you that you have been successfully added to our Lockerwise. This system allows you to manage your locker assignments efficiently and securely. 
                </p>

                
                <p style="font-size: 16px; color: #333; font-weight: bold; margin: 0 0 10px 0;">
                    Here are your account details:
                </p>
                <ul style="font-size: 16px; padding-left: 20px; margin: 0 0 15px 0; color: #333;">
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Temporary Password:</strong> ${password}</li>
                    <li><strong>Portal Link:</strong><a href="https://frontend-test-kappa-sage.vercel.app/login">https://frontend-test-kappa-sage.vercel.app/login</a></li>
                </ul>

                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    Please log in using the above credentials and change your password upon first login to ensure account security. 
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    If you have any questions or need assistance accessing your account, please don’t hesitate to contact us at <strong>[Support Email/Phone]<strong/>. 
                </p>

                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    We’re thrilled to have you onboard! 
                </p>
                <p style="font-size: 16px; color: #333; margin: 0;">
                    Best regards,<br />
                    <strong>DraconX Pvt. Ltd</strong>,<br/>  
                    <strong>"From Vision to Validation, faster"</strong>
                </p>
            </div>
        `;

        await mailSender(
            email,
            "Welcome! You've Been Added to the Lockerwise",
            htmlBody
        );

        return res.status(201).json({message: 'Staff Added Sucessfully...' });
    } catch (err) {
        return res.status(err.status || 500).json({ message: `Error in adding staff: ${err.message}` });
    }
};

exports.editStaff = async (req, res) => {
    try {
        const { id } = req.body;
        
        let user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const { name, role, email, password, phoneNumber, gender } = req.body;

        if (name &&  name.length!==0) user.name = name;
        if (role && role.length!==0) user.role = role;
        if (email &&  email.length!==0) user.email = email;
        if (phoneNumber && phoneNumber.length!==0) user.phoneNumber = phoneNumber;
        if (gender && gender.length!==0) user.gender = gender;
                       
        if (password && password.length!==0) {
            user.password = await bcrypt.hash(password, 10);
        }
                          
        await user.save();
        
        return res.status(200).json({message: 'User updated successfully',});
    } catch (err) {
        return res.status(err.status || 500).json({ message: `Error in editing staff: ${err.message}`});
    }
};

exports.viewStaffDetails = async (req, res) => {
    try {
        const { id } = req.body;

        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'User Details fetched successfully',
            user: user
        }); 
    } catch (err) {
        return res.status(err.status || 500).json({ message: `Error in fetching staff: ${err.message}` });
    }
};

exports.viewAllStaff = async (req, res) => {
    try {
        let users = await User.find({ role: "Staff" });
        
        return res.status(200).json({
            message: 'Users  fetched successfully',
            users: users.length ? users : []
        });
    } catch (err) {
        return res.status(err.status || 500).json({ message: `Error in fetching all staff: ${err.message}`});
    }
};

exports.removeStaff = async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ message: "Staff ID is required" });
        }

        const deletedStaff = await User.findByIdAndDelete(id);
        
        if (!deletedStaff) {
            return res.status(404).json({ message: "Staff not found" });
        }
        
        return res.status(200).json({ message: "Staff member removed successfully" });
    } catch (err) {
        return res.status(err.status || 500).json({ message: `Error in removing staff: ${err.message}` });
    }
};

exports.addLocker = async (req, res) => {
    try {
        const { LockerType, LockerNumber, LockerCodeCombinations, LockerPrice3Month, LockerPrice6Month, LockerPrice12Month, availableForGender , LockerSerialNumber} = req.body;
        const locker = await Locker.create({ LockerType, LockerNumber, LockerCodeCombinations, LockerPrice3Month, LockerPrice6Month, LockerPrice12Month, availableForGender, LockerSerialNumber });
        
        locker.LockerCode=LockerCodeCombinations[0];
        await locker.save();
        
        return res.status(200).json({
            message: "Locker Created Successfully",
            data: locker
        });
    } catch (err) {
        return res.status(err.status || 500).json({ message: `Error in adding locker: ${err.message}`});
    }
}

exports.addMultipleLocker = async (req, res) => {
    try {
        const lockersData = req.body;
        
        if (!Array.isArray(lockersData)) {
            return res.status(400).json({
                message: "Invalid input: Expected an array of locker objects"
            });
        }

        const updatedLockersData = lockersData.map((lockerData) => {
            if (lockerData.LockerCodeCombinations && lockerData.LockerCodeCombinations.length > 0) {
                lockerData.LockerCode = lockerData.LockerCodeCombinations[0];
            }
            return lockerData;
        });

        const newLockers = await Locker.insertMany(updatedLockersData);

        return res.status(200).json({
            message: "Lockers Created Successfully",
            data: newLockers
        });
    } catch (err) {
        return res.status(err.status || 500).json({ message: `Error in creating lockers: ${err.message}`});
    }
};
