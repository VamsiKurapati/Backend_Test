// authRoute.js
const express = require('express');

const router = express.Router();
const { login, signup, LogOut } = require('../controllers/authController.js');
const verifyToken=require('../utils/verifyUser.js')


router.post('/login', login);
router.post('/signup', signup);
router.get('/LogOut',verifyToken, LogOut);

module.exports = router;