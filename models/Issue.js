const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
    {
        // subject,description,type,status,LockerNumber,Email
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
        status: {
            type: String,
            // enum: ['resolved', 'inAction', 'notResolved'],
            default: 'Unresolved'
        },
        LockerNumber: {
            type: Number,
        },
        email: {
            type: String,
            required: true,
        },
        comment : {
            type: String,
            default: "",
        }
        
    },
    { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);