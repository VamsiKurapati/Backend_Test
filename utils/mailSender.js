const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, htmlBody) => {
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        let info = await transporter.sendMail({
            from: "7400563257gourav@gmail.com",
            to: email,
            subject: title,
            html: htmlBody,
            
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email: %s", error.message);
        throw new Error("Could not send email");
    }
};

module.exports = mailSender;
