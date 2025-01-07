const express = require('express');
const router = express.Router();

const { raiseTechnicalIssue, raiseLockerIssue, updateIssue,resolveIssue, deleteIssue, getAllIssue,getLockerIssue,getTechnicalIssue, updateComment } = require('../controllers/issueController.js');
const verifyToken=require('../utils/verifyUser.js')


router.post('/raiseTechnicalIssue', verifyToken, raiseTechnicalIssue);
router.post('/raiseLockerIssue',verifyToken, raiseLockerIssue);
router.put('/updateIssue',verifyToken, updateIssue);
router.put('/resolveIssue',verifyToken, resolveIssue);
router.get('/getAllIssue',verifyToken, getAllIssue);
router.get('/getLockerIssue',verifyToken, getLockerIssue);
router.get('/getTechnicalIssue',verifyToken, getTechnicalIssue);
router.post('/deleteIssue', verifyToken, deleteIssue);
router.put('/updateComment',verifyToken, updateComment);

module.exports = router;