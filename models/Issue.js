const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
    {
        // subject,description,type,priority,LockerNumber
        subject: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['technical', 'locker'],
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        status: {
            type: String,
            default: 'Unresolved'
        },
        LockerNumber: {
            type: Number,
        },

    },
    { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);