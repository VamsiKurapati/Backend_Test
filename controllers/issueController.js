require('dotenv').config();

const Issue = require('../models/Issue.js')
const Locker = require('../models/lockerModel.js')
const mailSender = require('../utils/mailSender.js')

const generateEmailBody = (type,message) => `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
      
                <div style="text-align: center; margin-bottom: 20px;">
                    <img 
                    src="${process.env.IMG_LINK}" 
                    alt="Company Logo" 
                    style="width: 500px; height: auto;" 
                    />
                </div>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    ${message} 
                </p>
                <p style="font-size: 16px; color: #333; margin: 0;">
                    Best regards,<br />
                    <strong>DraconX Pvt. Ltd</strong>,<br/>  
                    <strong>"From Vision to Validation, faster"</strong>
                </p>
            </div>
        `;

exports.raiseTechnicalIssue = async (req, res) => {
    try {
        const { subject, description, email } = req.body;

        const issue = await Issue.create({ subject, description, type: 'technical', email });

        await issue.save();

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
                    You have raised a <b>Techincal Issue </b> request.
                </p>
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    If this request was not requested by you or if you have any concerns, please contact us immediately.
                </p>
                <p style="font-size: 16px; color: #333; margin: 0;">
                    Best regards,<br />
                    <strong>DraconX Pvt. Ltd</strong>,<br/>  
                    <strong>"From Vision to Validation, faster"</strong>
                </p>
            </div>
        `;

        await mailSender(email, "Confirmation of Issue Reporting", htmlBody);

        return res.status(200).json({ message: "Technical issue raised  successfully", issue });
    } catch (err) {
        return res.status(err.status).json({ message : `Error in raising Issue: ${err.message}`});
    }
};

exports.raiseLockerIssue = async (req, res) => {
    try {
        const { subject, description, LockerNumber, email } = req.body;

        const locker = await Locker.findOne({ LockerNumber: LockerNumber });

        if (!locker) {
            return res.status(400).json({ message: "Locker not found" });
        }
l
        if (locker.employeeEmail !== email) {
            return res.status(400).json({ message: "Email does not match the locker owner" });
        }

        const issue = await Issue.create({ subject, description, type: 'locker', LockerNumber, email });

        await issue.save();

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
                    You have raised a <b>Locker Issue </b>request for <strong>Locker number : ${issue.LockerNumber}</strong>.
                </p>
                
                <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                    If this request was not requested by you or if you have any concerns, please contact us immediately.
                </p>

                <p style="font-size: 16px; color: #333; margin: 0;">
                    Best regards,<br />
                    <strong>DraconX Pvt. Ltd</strong>,<br/>  
                    <strong>"From Vision to Validation, faster"</strong>
                </p>

            </div>
        `;

        await mailSender(email, "Confirmation of Issue Reporting", htmlBody);

        return res.status(200).json({ message: "Locker issue raised  successfully", issue });
    } catch (err) {
        return res.status(err.status).json({ message : `Error in raising Issue: ${err.message}`});
    }
};

exports.getAllIssue = async (req, res) => {
    try {
        const data = await Issue.find();
        return res.status(200).json({ message: " issues fetched successfully", data });
    } catch (err) { 
        return res.status(err.status).json({ message : `Error in fetching Issue: ${err.message}`});
    }
};

exports.getTechnicalIssue = async (req, res) => {
    try {
        const data = await Issue.find({"type":"technical"});
        return res.status(200).json({ message: " issues fetched successfully", data });
    } catch (err) { 
        return res.status(err.status).json({ message : `Error in fetching Technical issues: ${err.message}`});
    }
};

exports.getLockerIssue = async (req, res) => {
    try {
        const data = await Issue.find({"type":"locker"});
        return res.status(200).json({ message: " issues fetched successfully", data });
    } catch (err) { 
        return res.status(err.status).json({ message : `Error in fetching Locker issues: ${err.message}`});
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { id, comment } = req.body;  // Expecting id of the issue and the new comment in the request body
        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        issue.comment = comment;
        await issue.save();
        return res.status(200).json({ message: "Comment updated successfully", issue });
    } catch (err) {
        return res.status(err.status).json({ message : `Error in updating comment: ${err.message}`});
    }
};

exports.updateIssue = async (req, res) => {
    try {
        const { id, status } = req.body;
        const issue = await Issue.findByIdAndUpdate(id,{status:status});
        console.log("Action is being taken. Status updated to In Action");
        
        let message = "";
        
        issue.type == "technical" ? message = "Your <b>Technical</b> issue is being <b>Processed</b>. We will keep you updated on the progress."
                                  : message = "Your <b>Locker</b> issue for the Locker Number <strong><u>" + issue.LockerNumber + "</u></strong> is being <b>Processed</b>.<br>We will keep you updated on the progress.";
         const htmlBody = generateEmailBody(
            "Update",
            message
        );
                
        await mailSender(issue.email, "Update On Your Issue", htmlBody);

        return res.status(200).json({ message: "action initiated", issue });
    } catch (err) {
        return res.status(err.status).json({ message : `Error in updating Issue: ${err.message}`});
    }
};

exports.resolveIssue = async (req, res) => {
    try {
        const { id, status } = req.body;
        const issue = await Issue.findByIdAndUpdate(id,{status:status});
        console.log("Issue resolved successfully. Status updated to Resolved");
        let message = "";
        
        issue.type == "technical" ? message = "Your <b>Technical</b> issue has been <b>Resolved</b>. Thank you for your patience."
                                  : message = "Your <b>Locker</b> issue for the Locker Number <strong><u>" + issue.LockerNumber + "</u></strong> has been <b>Resolved</b>.<br>Thank you for your patience.";
         const htmlBody = generateEmailBody(
            "Update",
            message
        );

        await mailSender(issue.email, "Issue has been Resolved", htmlBody);
        return res.status(200).json({ message: "Issue resolved  successfully", issue });
    } catch (err) {
        return res.status(err.status).json({ message : `Error in resolving Issue: ${err.message}`});
    }
};

exports.deleteIssue = async (req, res) => {
    try {
        const {id} = req.body;
        const issue = await Issue.findByIdAndDelete(id);
        return res.status(200).json({ message: " issues deleted successfully", issue });
    } catch (err) { 
        return res.status(err.status).json({ message : `Error in deleting Issue: ${err.message}`});
    }
};