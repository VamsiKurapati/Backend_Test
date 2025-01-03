const express = require('express');
const verifyToken=require('../utils/verifyUser.js')
const router = express.Router();
const { addStaff,removeStaff,editStaff,viewStaffDetails,viewAllStaff, addLocker, addMultipleLocker } = require('../controllers/adminControllers.js');

router.post('/addStaff',addStaff);
// router.post('/addStaff', verifyToken,addStaff);
router.post('/removeStaff',verifyToken, removeStaff);
router.put('/editStaff', editStaff);
// router.put('/editStaff', verifyToken,editStaff);
router.get('/viewAllStaff', verifyToken,viewAllStaff);
router.post('/viewStaffDetails',verifyToken, viewStaffDetails);
router.post('/addSingleLocker', verifyToken,addLocker);
router.post('/addMultipleLocker', addMultipleLocker);

module.exports = router;