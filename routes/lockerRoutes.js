const express = require('express');
const Locker = require("../models/lockerModel.js")
const router = express.Router();
const {
    getAvailableLocker,
    allocateLocker,
    renewLocker,
    cancelLockerAllocation,
    getAllLockers,
    getExpiredLockers,
    getAllocatedLockers,
    getAvailableLockers,
    getExpiringIn7daysLockers,
    changeLockerPricing,
    findLockerByUserEmail,
    updateLockerCode,
    chageLockerStatusToExpired,
    deleteLocker,
    getLockersByTypeandGender,
    getExpiringToday
}
    = require('../controllers/lockerController.js');
    const verifyToken=require('../utils/verifyUser.js')

router.post('/getAvailableLocker',verifyToken, getAvailableLocker);
router.post('/allocateLocker',verifyToken, allocateLocker);
router.post('/renewLocker',verifyToken, renewLocker);
router.post('/deleteLocker',verifyToken, deleteLocker);
router.post('/cancelLockerAllocation', verifyToken,cancelLockerAllocation);
router.get('/getAllLockers',verifyToken, getAllLockers);


router.get('/getExpiredLockers',verifyToken, getExpiredLockers);
router.get('/getAllocatedLockers',verifyToken, getAllocatedLockers);
router.get('/getAvailableLockers',verifyToken, getAvailableLockers);
router.get('/getExpiringIn7daysLockers',verifyToken, getExpiringIn7daysLockers);
router.get('/getExpiringToday',verifyToken, getExpiringToday);
router.post('/changeLockerPricing',verifyToken, changeLockerPricing);
router.post('/findLockerByUserEmail',verifyToken, findLockerByUserEmail);
router.post('/updateLockerCode',verifyToken, updateLockerCode);
router.post('/chageLockerStatusToExpired',verifyToken, chageLockerStatusToExpired);
router.get('/getLockersByTypeandGender',verifyToken, getLockersByTypeandGender);

router.put('/updateMultipleLockerPrices',verifyToken, async (req, res) => {
    try {
        const { LockerPrice3Month,
            LockerPrice6Month,
            LockerPrice12Month,
            availableForGender,
            LockerType } = req.body;

        if (!availableForGender || !['male', 'female'].includes(availableForGender.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid gender. Must be "male" or "female".' });
        }

        const updateData = {};
        if (LockerPrice3Month) updateData['LockerPrice3Month'] = LockerPrice3Month;
        if (LockerPrice6Month) updateData['LockerPrice6Month'] = LockerPrice6Month;
        if (LockerPrice12Month) updateData['LockerPrice12Month'] = LockerPrice12Month;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'At least one price must be provided (3, 6, or 12 months).' });
        }

        const result = await Locker.updateMany(
            { availableForGender: availableForGender, LockerType: LockerType },
            { $set: updateData }
        );

        res.status(200).json({
            message: 'Locker prices updated successfully.',
            updatedCount: result.nModified   
        })
    } catch (error) {
        console.error('Error updating locker prices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;