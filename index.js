const express = require('express')
const cookieParser = require('cookie-parser');
const dbConnect = require('./utils/databaseConnect.js')
const cors = require('cors');
const userroute = require('./routes/authRoutes.js')
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

const verifyToken = require('./utils/verifyUser.js')

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173/",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

async function startServer() {
  try{
    await dbConnect();
    app.listen(process.env.PORT, () => {
        console.log(`server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(`Error Connecting To DB: ${error.message}`);
  }
}

startServer();

app.use('/api/user', userroute);
app.use('/api/admin', adminRoute);
app.use('/api/resetPassword', resetPasswordRoute);
app.use('/api/locker', lockerRoute);
app.use('/api/issue', issueRoute);
app.use('/api/profile', profileRoute);

app.get('/', (req, res) => {
  res.send('Welcome to the backend!');
});

function formatdate(date){
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

cron.schedule('*/1 * * * *', async () => {
  try {
      const todayUTC = new Date();
      todayUTC.setHours(0, 0, 0, 0); // Start of UTC day

      const nowUTC = new Date();
      nowUTC.setHours(nowUTC.getHours(), nowUTC.getMinutes(), nowUTC.getSeconds(), nowUTC.getMilliseconds()); // Current UTC time
      //console.log('Now in UTC:', nowUTC);
      // Find lockers whose expiration date is between todayUTC and nowUTC, and have a status that is not already "expired"
      const lockersToUpdate = await Locker.find({
          expiresOn: { $gte: todayUTC, $lte: nowUTC },
          LockerStatus: { $ne: "expired" }
      });
      
      for (const locker of lockersToUpdate) {
          locker.LockerStatus = "expired"; // Set status to "expired"
          await locker.save(); // Save the updated locker
          console.log(`Time : ${Date()} and Locker ${locker.LockerNumber} status set to "expired".`);
      }
      
  } catch (err) {
      console.log(`Error in updating locker statuses: ${err.message}`);
  }
});


cron.schedule('*/5 * * * *', async () => {
    try {
      const todayUTC = new Date();
      todayUTC.setHours(0, 0, 0, 0); // Start of UTC day

      const endOfTodayUTC = new Date(todayUTC);
      endOfTodayUTC.setHours(23, 59, 59, 999); // End of UTC day

      const data = await Locker.find({
          expiresOn: { $gte: todayUTC, $lte: endOfTodayUTC },
          emailSent: { $ne: true },
      });

      for (const locker of data) {
          const email = locker.employeeEmail; 
          const name = locker.employeeName;
          const lockerNumber = locker.LockerNumber
          const startDate = locker.StartDate;
          const endDate = locker.EndDate;
          const duration = locker.Duration
          const currentDate = new Date()
          const formatted = formatdate(currentDate)
          const htmlBody = `
              <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
    
              <div style="text-align: center; margin-bottom: 20px;">
                  <img 
                  src="https://i.postimg.cc/N0HLHWXH/company-Logo.png" 
                  alt="Company Logo" 
                  style="width: 500px; height: auto;" 
                  />
              </div>

              
              <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                  Dear ${name},
              </p>
              <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                  We want to notify you that the locker assigned to you is expiring <b>Today</b>(${formatted}). Below are the details of the locker:
              </p>

              
              <p style="font-size: 16px; color: #333; font-weight: bold; margin: 0 0 10px 0;">
                  Locker Details:
              </p>
              <ul style="font-size: 16px; padding-left: 20px; margin: 0 0 15px 0; color: #333;">
                  <li><strong>Locker Number:</strong> ${lockerNumber}</li>
                  <li><strong>Original Validity Period:</strong> ${duration === "customize" ? `${formatdate(startDate)} to ${formatdate(endDate)}` : `${duration} Months`}</li>
              </ul>

              
              <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                  If you require a locker in the future, please submit a new request through the Locker Management System or contact us at <strong>[Support Email/Phone]</strong>.
              </p>
              <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                  We appreciate your cooperation and thank you for using our locker management service.
              </p>
              <p style="font-size: 16px; color: #333; margin: 0;">
                  Best regards,<br />
                  <strong>DraconX Pvt. Ltd</strong>,<br/>  
                  <strong>"From Vision to Validation, faster"</strong>
              </p>
          </div>
          `;
          if (email) {
              try {
                  await mailSender(email, "Locker Expiration Notification", htmlBody);
                  // Mark email as sent for this locker
                  locker.emailSent = true;
                  await locker.save();
              } catch (emailError) {
                  console.error(`Error sending email to ${email}: ${emailError.message}`);
              }
          } else {
              console.warn(`No email found for locker ${locker._id}`);
          }
      }
  } catch (err) {
      console.log(`Error in fetching lockers expiring today: ${err.message}`);
  }
});


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
    const token = req.headers.authorization.split(' ')[1];
    const response = await axios.post('https://frontend-test-kappa-sage.vercel.app/api/admin/addMultipleLocker', data,{
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request
      },
    });
    if (response.status === 200) {
      res.status(200).json({ message: "File processed and lockers added successfully", data });
    } else {
      res.status(response.status).json({ message: "Failed to add lockers", details: response.data });
    }
  } catch (err) {
    res.status(err.status || 500).json({ message: `Error processing file: ${err.message}` });
  }
});
