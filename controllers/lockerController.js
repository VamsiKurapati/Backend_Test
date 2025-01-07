require('dotenv').config();

const Locker = require("../models/lockerModel.js");
const mailSender = require("../utils/mailSender.js");
const fs = require("fs");

exports.getAvailableLocker = async (req, res) => {
    try {
        const { lockerType, employeeGender } = req.body;

        if (!lockerType || !employeeGender) {
            return res.status(400).json({ message: "lockerType and employeeGender are required" });
        }

        const locker = await Locker.findOne({
            LockerStatus: "available",
            LockerType: lockerType,
            availableForGender: employeeGender,
        });

        if (!locker) {
            return res.status(400).json({ message: "No available locker found matching the criteria." });
        }

        res.status(200).json({
            message: "Available locker found",
            data: locker,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching Available Lockers: ${err.message}`});
    }
};

function formatdate(date){
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
};

exports.allocateLocker = async (req, res) => {
    try {
        const { lockerNumber, lockerType, lockerCode, employeeName, employeeId, employeeEmail, employeePhone, employeeGender, costToEmployee, duration, startDate, endDate } = req.body;

        if (!lockerNumber) {
            return res.status(400).json({ message: "lockerNumber is required" });
        }

        const locker = await Locker.findOne({
            LockerNumber: lockerNumber,
            LockerStatus: "available",
        });

        if (!locker) {
            return res.status(400).json({ message: "Locker is not available or does not exist" });
        }

        let expiresOn;
        if (duration === "3") {
            // Set expiresOn to 3 months from the current date
            const threeMonthsFromNow = new Date();
            threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
            threeMonthsFromNow.setHours(23, 59, 59, 999); // Set time to 11:59 PM
            expiresOn = threeMonthsFromNow.toISOString();
        } else if (duration === "6") {
            // Set expiresOn to 6 months from the current date
            const sixMonthsFromNow = new Date();
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
            sixMonthsFromNow.setHours(23, 59, 59, 999); // Set time to 11:59 PM
            expiresOn = sixMonthsFromNow.toISOString();
        } else if (duration === "12") {
            // Set expiresOn to 12 months from the current date
            const twelveMonthsFromNow = new Date();
            twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12);
            twelveMonthsFromNow.setHours(23, 59, 59, 999); // Set time to 11:59 PM
            expiresOn = twelveMonthsFromNow.toISOString();
        } else if (endDate) {
            // Set expiresOn to provided endDate
            const expires = new Date(endDate);
            expires.setHours(23, 59, 59, 999); // Set time to 11:59 PM
            expiresOn = expires.toISOString();
        }

        locker.LockerCode = lockerCode;
        locker.LockerType = lockerType;
        locker.employeeName = employeeName;
        locker.employeeId = employeeId;
        locker.employeeEmail = employeeEmail;
        locker.employeePhone = employeePhone;
        locker.employeeGender = employeeGender;
        locker.CostToEmployee = costToEmployee;
        locker.Duration = duration;
        locker.StartDate = startDate;
        locker.EndDate = endDate;
        locker.LockerStatus = "occupied";

        locker.expiresOn = expiresOn;

        await locker.save();
        const email = employeeEmail;
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
      
                <div style="text-align: center; margin-bottom: 20px;">
                    <img 
                    src="${process.env.IMG_LINK}" 
                    alt="Company Logo" 
                    style="width: 500px; height: auto;" 
                    />
                </div>

                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    Dear ${employeeName},
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    We are pleased to inform you that a locker has been assigned to you as per your request. Please find the details below:
                </p>

                
                <p style="font-size: 16px; color: #333; font-weight: bold; margin: 0 0 10px 0;">
                    Locker Assignment Details:
                </p>
                <ul style="font-size: 16px; padding-left: 20px; margin: 0 0 15px 0; color: #333;">
                    <li><strong>Locker Number:</strong> ${lockerNumber}</li>
                    <li><strong>Locker Code:</strong> ${lockerCode}</li>
                    <li><strong>Duration:</strong> ${duration === "customize" ? `${formatdate(startDate)} to ${formatdate(endDate)}` : `${duration} Months`}</li>
                </ul>

                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    Kindly ensure to use the locker responsibly and report any issues or concerns to the administration team.
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    If you have any questions or require further assistance, please do not hesitate to contact us at <strong>[Support Email/Phone]</strong>.
                </p>
                <p style="font-size: 16px; color: #333; margin: 0;">
                    Best regards,<br />
                    <strong>DraconX Pvt. Ltd</strong>,<br/>
                    <strong>"From Vision to Validation, faster"</strong>  
                </p>
            </div>
        `;
        
        await mailSender(email, "Your Locker Assignment Details ", htmlBody);

        res.status(200).json({
            message: "Locker allocated successfully",
            data: locker,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in allocating Locker: ${err.message}`});
    }
};

exports.cancelLockerAllocation = async (req, res) => {
    try {
        const { lockerNumber, EmployeeEmail } = req.body;
        if (!lockerNumber || !EmployeeEmail) {
            return res.status(400).json({ message: "lockerNumber is required" });
        }

        const email = EmployeeEmail;
        const locker = await Locker.findOne({
            LockerNumber: lockerNumber,
        });

        if (!locker) {
            return res.status(400).json({ message: "Locker is not available or does not exist" });
        }

        if(locker.employeeEmail !== EmployeeEmail){
            return res.status(400).json({message: "Enter correct details"});
        }
        const duration = locker.Duration
        const name = locker.employeeName

        const currentDate = new Date();
        const formatted = currentDate.toLocaleDateString()

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
      
                <div style="text-align: center; margin-bottom: 20px;">
                    <img 
                    src="${process.env.IMG_LINK}" 
                    alt="Company Logo" 
                    style="width: 500px; height: auto;" 
                    />
                </div>

                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    Dear ${name},
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    We regret to inform you that your locker assignment has been cancelled. Below are the details of the cancelled locker:
                </p>

                
                <p style="font-size: 16px; color: #333; font-weight: bold; margin: 0 0 10px 0;">
                    Locker Details:
                </p>
                <ul style="font-size: 16px; padding-left: 20px; margin: 0 0 15px 0; color: #333;">
                    <li><strong>Locker Number:</strong> ${lockerNumber}</li>
                    <li><strong>Cancellation Date:</strong> ${formatted}</li>
                    <li><strong>Original Validity Period:</strong> ${duration === "customize" ? `${formatdate(locker.StartDate)} to ${formatdate(locker.EndDate)}` : `${duration} Months`}</li>
                </ul>

                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    If this cancellation was not requested by you or if you have any concerns, please contact us immediately at <strong>[Support Email/Phone]</strong>.
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    We apologize for any inconvenience this may cause and are happy to assist with reassigning a locker if needed.
                </p>

                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    Thank you for your understanding.
                </p>
                <p style="font-size: 16px; color: #333; margin: 0;">
                    Best regards,<br />
                    <strong>DraconX Pvt. Ltd</strong>,<br/>  
                    <strong>"From Vision to Validation, faster"</strong>
                </p>
            </div>
        `;
        await mailSender(email, "Notification of Locker Cancellation", htmlBody);

        let oldCode = locker.LockerCode;
        oldCode = oldCode.substring(1) + oldCode[0];
        locker.LockerStatus = "available";
        locker.LockerCode = oldCode;

        locker.employeeName = "";
        locker.employeeId = "";
        locker.employeeEmail = "";
        locker.employeePhone = "";
        locker.employeeGender = "None";
        locker.CostToEmployee = "";
        locker.Duration = "";
        locker.StartDate = "";
        locker.EndDate = "";
        locker.LockerStatus = "available";
        locker.expiresOn = "";
        locker.emailSent = false;

        await locker.save();

        res.status(200).json({
            message: "Locker taken back successfully",
            data: locker,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in canceling locker: ${err.message}`});
    }
};

exports.renewLocker = async (req, res) => {
    try {
        const { lockerNumber, costToEmployee, duration, startDate, endDate, EmployeeEmail } = req.body;

        if (!lockerNumber || !EmployeeEmail) {
            return res.status(400).json({ message: "lockerNumber is required" });
        }

        const email = EmployeeEmail;
        const locker = await Locker.findOne({
            LockerNumber: lockerNumber,
        });
        const employeeName = locker.employeeName

        if (!locker) {
            return res.status(400).json({ message: "Locker is not available or does not exist" });
        }

        let expiresOn;
        if (duration === "3") {
            // Set expiresOn to 3 months from the current date
            const threeMonthsFromNow = new Date();
            threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
            threeMonthsFromNow.setHours(23,59,59,999);
            expiresOn = threeMonthsFromNow.toISOString(); 
        } else if (duration === "6") {
            // Set expiresOn to 6 months from the current date
            const sixMonthsFromNow = new Date();
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
            sixMonthsFromNow.setHours(23,59,59,999);
            expiresOn = sixMonthsFromNow.toISOString(); 
        } else if (duration === "12") {
            // Set expiresOn to 12 months from the current date
            const twelveMonthsFromNow = new Date();
            twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12);
            twelveMonthsFromNow.setHours(23,59,59,999);
            expiresOn = twelveMonthsFromNow.toISOString(); 
        } else if (endDate) {
            // Set expiresOn to provided endDate
            const expires = new Date(endDate);
            expires.setHours(23,59,59,999);
            expiresOn = expires.toISOString();
        }

        locker.CostToEmployee = costToEmployee;
        locker.Duration = duration;
        locker.StartDate = startDate;
        locker.EndDate = endDate;
        locker.LockerStatus = "occupied";
        locker.emailSent = "false";
        locker.expiresOn = expiresOn;
        
        await locker.save();

        const currentDate = new Date()
        const formattedDate = currentDate.toLocaleDateString();

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
      
                <div style="text-align: center; margin-bottom: 20px;">
                    <img 
                    src="${process.env.IMG_LINK}" 
                    alt="Company Logo" 
                    style="width: 500px; height: auto;" 
                    />
                </div>

                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    Dear ${employeeName},
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                   We are pleased to inform you that your locker renewal has been successfully processed. Below are the updated details of your locker:
                </p>

                
                <p style="font-size: 16px; color: #333; font-weight: bold; margin: 0 0 10px 0;">
                    Locker Details:
                </p>
                <ul style="font-size: 16px; padding-left: 20px; margin: 0 0 15px 0; color: #333;">
                    <li><strong>Locker Number:</strong> ${lockerNumber}</li>
                    <li><strong>Renewal Date:</strong> ${formattedDate}</li>
                    <li><strong>New Validity Period:</strong> ${duration === "customize" ? `${formatdate(startDate)} to ${formatdate(endDate)}` : `${duration} Months`}</li>
                </ul>

                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    Thank you for renewing your locker. We are committed to providing a seamless and secure locker management experience
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    If you have any questions or need further assistance, please feel free to contact us at <strong>[Support Email/Phone]</strong>.
                </p>
                <p style="font-size: 16px; color: #333; margin: 0;">
                    Best regards,<br />
                    <strong>DraconX Pvt. Ltd</strong>,<br/>
                    <strong>"From Vision to Validation, faster"</strong>  
                </p>
            </div>
        `;

        await mailSender(email, "Your Locker Renewal Has Been Successfully Processsed", htmlBody);
        res.status(200).json({
            message: "Locker Renewed successfully",
            data: locker,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in Renewing Locker: ${err.message}`});
    }
};

exports.getAllLockers = async (req, res) => {
    try {
        const data = await Locker.find();
        res.status(200).json({
            message: "All Lockers",
            data,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching Lockers: ${err.message}`});
    }
};

exports.getAllocatedLockers = async (req, res) => {
    try {
        const data = await Locker.find({ LockerStatus: "occupied" });
        res.status(200).json({
            message: "All allocated Lockers",
            data,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching Allocated Lockers: ${err.message}`});
    }
};

exports.getAvailableLockers = async (req, res) => {
    try {
        const data = await Locker.find({ LockerStatus: "available" });
        res.status(200).json({
            message: "All available Lockers",
            data,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching Available Lockers: ${err.message}`});
    }
};

exports.getExpiredLockers = async (req, res) => {
    try {
        const data = await Locker.find({ LockerStatus: "expired" });
        res.status(200).json({
            message: "All expired Lockers",
            data,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching Expired Lockers: ${err.message}`});
    }
};

exports.changeLockerPricing = async (req, res) => {
    try {
        const { id, LockerPrice3Month, LockerPrice6Month, LockerPrice12Month } = req.body;
        const locker = await Locker.findById(id);
        if (!locker) {
            return res.status(400).json({ message: "Locker not found" });
        }
        locker.LockerPrice3Month = LockerPrice3Month;
        locker.LockerPrice6Month = LockerPrice6Month;
        locker.LockerPrice12Month = LockerPrice12Month;
        await locker.save();
        res.status(200).json({ message: "Locker pricing updated successfully", locker });
    } catch (err) {
        res.status(err.status).json({ message : `Error in updating prices: ${err.message}`});
    }
};

exports.getExpiringIn7daysLockers = async (req, res) => {
    try {
        const todayUTC = new Date();
        todayUTC.setHours(0, 0, 0, 0); // Start of IST day

        const sevenDaysFromNowUTC = new Date(todayUTC);
        sevenDaysFromNowUTC.setDate(todayUTC.getUTCDate() + 7); // 7 days from now

        const data = await Locker.find({
            expiresOn: { $gte: todayUTC, $lte: sevenDaysFromNowUTC },
        });

        res.status(200).json({
            message: "Lockers expiring within the next 7 days",
            data,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching expiring Lockers: ${err.message}`});
    }
};

exports.getExpiringToday = async (req, res) => {
    try {
        const todayUTC = new Date();
        todayUTC.setHours(0, 0, 0, 0); // Start of UTC day

        const endOfTodayUTC = new Date(todayUTC);
        endOfTodayUTC.setHours(23, 59, 59, 999); // End of UTC day

        const data = await Locker.find({
            expiresOn: { $gte: todayUTC, $lte: endOfTodayUTC },
        });

        res.status(200).json({
            message: "Lockers expiring today",
            data,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching expiring lockers: ${err.message}`});
    }
};

exports.findLockerByUserEmail = async (req, res) => {
    try {
        const { employeeEmail } = req.body;

        // Find all lockers associated with the given employee email
        const lockers = await Locker.find({ employeeEmail: employeeEmail });

        // Check if lockers were found
        if (lockers.length === 0) {
            return res.status(400).json({ message: "No lockers found for this email" });
        }

        // Respond with the list of lockers
        res.status(200).json({ message: "Lockers found successfully", lockers });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching locker: ${err.message}`});
    }
};

exports.updateLockerCode = async (req, res) => {
    try {
        const { id } = req.body;

        // Find the locker by ID
        const locker = await Locker.findById(id);
        if (!locker) {
            return res.status(400).json({ message: "Locker not found" });
        }

        const { LockerCodeCombinations, LockerCode } = locker;

        // Find the current index of LockerCode in LockerCodeCombinations
        const currentIndex = LockerCodeCombinations.indexOf(LockerCode);

        // Calculate the next index in a circular manner
        const nextIndex = (currentIndex + 1) % LockerCodeCombinations.length;

        // Update LockerCode to the next code in the array
        locker.LockerCode = LockerCodeCombinations[nextIndex];

        // Save the updated locker
        await locker.save();

        res.status(200).json({ message: "Locker code updated successfully", locker });
    } catch (err) {
        res.status(err.status).json({ message : `Error in Updating Locker Code: ${err.message}`});
    }
};

exports.chageLockerStatusToExpired = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: "Locker ID is required" });
        }

        const updatedLocker = await Locker.findByIdAndUpdate(id, { LockerStatus: "expired" }, { new: true });

        if (!updatedLocker) {
            return res.status(400).json({ message: "Locker not found" });
        }

        res.status(200).json({
            message: "Locker status updated to expired",
            data: updatedLocker,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching Issue: ${err.message}`});
    }
};

exports.deleteLocker = async (req, res) => {
    try {
        const { lockerNumber } = req.body;

        console.log(lockerNumber);

        if (!lockerNumber) {
            return res.status(400).json({ message: "Locker number is required" });
        }

        // Find and delete by lockerNumber instead of _id
        const deletedLocker = await Locker.findOneAndDelete({ LockerNumber: lockerNumber });

        if (!deletedLocker) {
            return res.status(400).json({ message: "Locker not found" });
        }

        res.status(200).json({
            message: "Locker deleted successfully",
            data: deletedLocker,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in deleting Locker: ${err.message}`});
    }
};

exports.getLockersByTypeandGender = async (req, res) => {
    try {
        const type = req.query.type;
        const gender = req.query.gender;
        const lockers = await Locker.find({
            LockerType: type,
            availableForGender: gender,
        });

        res.status(200).json({
            message: "Locker Fetched successfully",
            data: lockers,
        });
    } catch (err) {
        res.status(err.status).json({ message : `Error in fetching Locker: ${err.message}`});
    }
};
