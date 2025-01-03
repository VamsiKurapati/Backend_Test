const Issue = require('../models/Issue.js')
const mailSender = require('../utils/mailSender.js')

exports.raiseTechnicalIssue = async (req, res, next) => {
    try {
        const { subject, description, priority } = req.body;

        const issue = await Issue.create({ subject: subject, description: description, type: 'technical', priority })

        return res.status(200).json({ message: "technical issue raised  successfully", issue });
    } catch (err) {
        console.log(`Error in finding lockers: ${err.message}`);
        return next(err);
    }
};

exports.raiseLockerIssue = async (req, res, next) => {
    try {
        const { subject, description, LockerNumber, priority } = req.body;

        const issue = await Issue.create({ subject, description, LockerNumber, priority, type: 'locker' });

        return res.status(200).json({ message: "Locker issue raised  successfully", issue });
    } catch (err) {
        console.log(`Error in finding lockers: ${err.message}`);
        return next(err);
    }
};

exports.getAllIssue = async (req, res, next) => {
    try {
        const data = await Issue.find();
        return res.status(200).json({ message: " issues fetched successfully", data });
    } catch (err) { 
        console.log(`Error in finding lockers: ${err.message}`);
        return next(err);
    }
};

exports.getTechnicalIssue = async (req, res, next) => {
    try {
        const data = await Issue.find({"type":"technical"});
        console.log(data);
        return res.status(200).json({ message: " issues fetched successfully", data });
    } catch (err) { 
        console.log(`Error in finding lockers: ${err.message}`);
        return next(err);
    }
};

exports.getLockerIssue = async (req, res, next) => {
    try {
        const data = await Issue.find({"type":"locker"});
        return res.status(200).json({ message: " issues fetched successfully", data });
    } catch (err) { 
        console.log(`Error in finding lockers: ${err.message}`);
        return next(err);
    }
};

exports.updateIssue = async (req, res, next) => {
    try {
        const { id, status } = req.body;
        const issue = await Issue.findByIdAndUpdate(id,{status:status});
        console.log("Action is being taken. Status updated to In Action");
        return res.status(200).json({ message: "action initiated", issue });
    } catch (err) {
        console.log(`Error in finding lockers: ${err.message}`);
        return next(err);
    }
};

exports.resolveIssue = async (req, res, next) => {
    try {
        const { id, status } = req.body;
        const issue = await Issue.findByIdAndUpdate(id,{status:status});
        console.log("Issue resolved successfully. Status updated to Resolved");
        return res.status(200).json({ message: "Issue resolved  successfully", issue });
    } catch (err) {
        console.log(`Error in finding lockers: ${err.message}`);
        return next(err);
    }
};

exports.deleteIssue = async (req, res, next) => {
    try {
         const {id} = req.body;
         const issue = await Issue.findByIdAndDelete(id);
         console.log("Issue Deleted successfully.");
         return res.status(200).json({ message: " issues deleted successfully", issue });
    } catch (err) { 
        console.log(`Error in finding lockers: ${err.message}`);
        return next(err);
    }
};