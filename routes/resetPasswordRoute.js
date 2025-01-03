// authRoute.js
const express = require('express');
const router = express.Router();
const { getOtp, validateOTP, resetPassword } = require('../controllers/resetPassword.js');


router.post('/getOtp', getOtp);
router.post('/validateOTP', validateOTP);
router.post('/resetPassword', resetPassword);



module.exports = router;