const mongoose = require('mongoose');

const lockerSchema = new mongoose.Schema(
    {

        // LockerType,LockerStatus,LockerNumber,LockerCode,
        LockerType: {
            type: String,
            // required: true,
            enum: ['half', 'full'],
        },
        LockerStatus: {
            type: String,
            enum: ['occupied', 'available', 'expired'],
            default: 'available',
        },
        LockerNumber: {
            type: Number,
            // required: true,
            unique: true,
        },
        LockerCode: {
            type: String,
        },
        LockerSerialNumber: {
            type: String
        },
        LockerCodeCombinations: {
            type: [String],
        },
        LockerPrice3Month: {
            type: Number,
            // required: true,
        },
        LockerPrice6Month: {
            type: Number,
            // required: true,
        },
        LockerPrice12Month: {
            type: Number,
            // required: true,
        },
        availableForGender: {
            type: String,
            // required: true,
            enum: ['Male', 'Female'],
        },
        employeeName: {
            type: String,
            // employeeName,employeeId,employeeEmail,employeePhone,employeeGender,CostToEmployee,Duration,StartDate,EndDate
        },
        employeeId: {
            type: String,
        },
        employeeEmail: {
            type: String,

        },
        employeePhone: {
            type: String,
        },
        employeeGender: {
            type: String,
            enum: ['Male', 'Female', 'None'],
        },
        CostToEmployee: {
            type: Number,
        },
        Duration: {
            type: String,
        },
        StartDate: {
            type: Date,
        },
        EndDate: {
            type: Date,
        },
        expiresOn: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Locker', lockerSchema);