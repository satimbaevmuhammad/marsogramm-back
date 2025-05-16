const nodemailer = require('nodemailer');
require('dotenv').config();

const sendVerificationCode = async (email, code) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Tasdiqlash kodingiz',
        html: `<h2>Sizning tasdiqlash kodingiz: <strong>${code}</strong></h2>`
    });
};

module.exports = sendVerificationCode;
