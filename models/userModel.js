const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: false,
        },
        role: {
            type: String,
            // required: true,
            enum: ['Admin', 'Staff'],
        },
        
        gender: {
            type: String,
            required: true,
            enum: ['Male', 'Female'],
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);