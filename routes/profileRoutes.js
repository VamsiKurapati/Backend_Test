// authRoute.js
const express = require('express');
const router = express.Router();
const verifyToken=require('../utils/verifyUser.js')

const { viewProfile,updateProfile } = require('../controllers/profileController.js');


router.post('/viewProfile',verifyToken, viewProfile);
router.post('/updateProfile',verifyToken, updateProfile);

module.exports = router;       