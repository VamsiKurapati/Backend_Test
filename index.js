const express = require('express')
const cookieParser = require('cookie-parser');
const dbConnect = require('./utils/databaseConnect.js')
const cors = require('cors');
const userroute = require('./routes/authRoutes.js')
//const Locker=require('./models/locker.js')
const adminRoute = require('./routes/adminRoutes.js')
const resetPasswordRoute = require('./routes/resetPasswordRoute.js')
const lockerRoute = require('./routes/lockerRoutes.js')
const issueRoute = require('./routes/issueRoute.js')
const profileRoute = require('./routes/profileRoutes.js')
require('dotenv').config();
const mailSender=require('./utils/mailSender.js')
const cron = require('node-cron');
const Locker = require('./models/lockerModel.js')
const multer = require('multer');
const XLSX = require('xlsx');
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const axios = require('axios'); // Import axios

const verifyToken=require('./utils/verifyUser.js')
dbConnect();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Add other methods as needed
  allowedHeaders: ['Content-Type', 'Authorization'], // Add other headers if required
}));

app.use('/api/user', userroute);
app.use('/api/admin', adminRoute);
app.use('/api/resetPassword', resetPasswordRoute);
app.use('/api/locker', lockerRoute);
app.use('/api/issue', issueRoute);
app.use('/api/profile', profileRoute);

app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
})

app.get('/', (req, res) => {
  res.send('Welcome to the backend!');
});


cron.schedule('* * * * *', async () => {
  try {
    const nowInIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);

    const result = await Locker.updateMany(
      { expiresOn: { $lte: nowInIST }, LockerStatus: { $ne: "expired" } },
      { LockerStatus: "expired" }
    );

    console.log(result);
  } catch (err) {
    console.error(`Error updating expired lockers: ${err.message}`);
  }
});

// cron.schedule('* * * * *', async () => {
  cron.schedule('0 */6 * * *', async () => {
  try {
    const todayIST = new Date();
    todayIST.setHours(0, 0, 0, 0); // Start of IST day

    const endOfTodayIST = new Date(todayIST);
    endOfTodayIST.setHours(23, 59, 59, 999); // End of IST day

    const data = await Locker.find({
        expiresOn: { $gte: todayIST, $lte: endOfTodayIST },
    });
    
    for (const locker of data) {
        const email = locker.employeeEmail; // Assuming the field is `employeeEmail`
        if (email) {
            try {
                await mailSender(
                    email,
                    "Locker Expiration Notification",
                    `Your locker with ID ${locker._id} is expiring today. Please take necessary action.`
                );
                console.log(`Email sent to ${email} for locker ${locker._id}`);
            } catch (emailError) {
                console.error(`Error sending email to ${email}: ${emailError.message}`);
            }
        } else {
            console.warn(`No email found for locker ${locker._id}`);
        }
    }
  } catch (err) {
    console.error(`Error updating expired lockers: ${err.message}`);
  }
});


// cron.schedule('* * * * *', async () => {   // will run every hour
//   try {
     
//     const result = await Locker.updateMany(
//           { expiresOn: { $lte: new Date() }, LockerStatus: { $ne: "expired" } },
//           { LockerStatus: "expired" }
//       );


//       console.log(result);
//       // console.log(`Expired lockers updated: ${result.nModified}`);
//   } catch (err) {
//       console.error(`Error updating expired lockers: ${err.message}`);
//   }
// });


const COLUMN_MAPPING = {
  0: "LockerType",
  1: "LockerNumber",
  2: "combination1",
  3: "combination2",
  4: "combination3",
  5: "combination4",
  6: "combination5",
  7: "LockerPrice3Month",
  8: "LockerPrice6Month",
  9: "LockerPrice12Month",
  10: "availableForGender",
  11: "LockerSerialNumber"
};

app.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    // Skip the first row (header) and map rows to locker objects
    const data = rows.slice(1).map((row) => {
      let mappedRow = {};

      row.forEach((cell, index) => {
        const columnKey = COLUMN_MAPPING[index];
        if (columnKey) {
          // Create the LockerCodeCombinations array by combining combination columns
          if (columnKey.startsWith("combination")) {
            if (!mappedRow.LockerCodeCombinations) mappedRow.LockerCodeCombinations = [];
            mappedRow.LockerCodeCombinations.push(cell);
          } else {
            // Map other fields directly
            mappedRow[columnKey] = cell;
          }
        }
      });

      return mappedRow;
    });

    // Send data array directly in the request body to match addMultipleLocker
    const response = await axios.post('http://localhost:3000/api/admin/addMultipleLocker', data);
    if (response.status === 200) {
      res.status(200).json({ message: "File processed and lockers added successfully", data });
    } else {
      res.status(response.status).json({ message: "Failed to add lockers", details: response.data });
    }
  } catch (err) {
    res.status(500).json({ message: `Error processing file: ${err.message}` });
  }
});
