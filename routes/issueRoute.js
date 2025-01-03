const express = require('express');
const router = express.Router();

const { raiseTechnicalIssue, raiseLockerIssue, updateIssue, resolveIssue, deleteIssue, getAllIssue,getLockerIssue,getTechnicalIssue } = require('../controllers/issueController.js');
const verifyToken=require('../utils/verifyUser.js')


router.post('/raiseTechnicalIssue', raiseTechnicalIssue);
router.post('/raiseLockerIssue',verifyToken, raiseLockerIssue);
router.put('/updateIssue',verifyToken, updateIssue);
router.put('/resolveIssue',verifyToken, resolveIssue);
router.get('/getAllIssue',verifyToken, getAllIssue);
router.get('/getLockerIssue',verifyToken, getLockerIssue);
router.get('/getTechnicalIssue',verifyToken, getTechnicalIssue);
router.post('/deleteIssue', verifyToken, deleteIssue);

module.exports = router;