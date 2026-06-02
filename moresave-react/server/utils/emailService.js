const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Moresave SACCO" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const notifyMember = {
  registration: (email, name, memberNumber) => {
    return sendEmail(
      email,
      'Welcome to Moresave SACCO!',
      `Hello ${name}, your registration application has been received. Your Member Number is ${memberNumber}. It is currently pending approval.`,
      `<div style="font-family: Arial; padding: 20px; border: 1px solid #eee;">
         <h2 style="color: #4E3526;">Welcome to Moresave SACCO!</h2>
         <p>Hello <strong>${name}</strong>,</p>
         <p>Your registration application has been received successfully.</p>
         <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
           <p style="margin: 0;"><strong>Member Number:</strong> ${memberNumber}</p>
           <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Pending Approval</p>
         </div>
         <p>We will notify you once your application has been reviewed.</p>
       </div>`
    );
  },
  approval: (email, name, memberNumber) => {
    return sendEmail(
      email,
      'Account Activated - Moresave SACCO',
      `Congratulations ${name}! Your membership has been approved. You can now log in using ${memberNumber} as your username.`,
      `<div style="font-family: Arial; padding: 20px; border: 1px solid #eee;">
         <h2 style="color: #27ae60;">Account Activated!</h2>
         <p>Hello <strong>${name}</strong>,</p>
         <p>Congratulations! Your membership at Moresave SACCO has been formally approved.</p>
         <p>You can now log in to the portal to view your savings and apply for loans.</p>
         <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
           <p style="margin: 0;"><strong>Username:</strong> ${memberNumber}</p>
           <p style="margin: 5px 0 0 0;"><strong>Initial Password:</strong> ${memberNumber}</p>
         </div>
         <p><a href="http://localhost:5173/login" style="color: #8B6B4A; font-weight: bold;">Click here to log in</a></p>
       </div>`
    );
  },
  transaction: (email, name, type, amount, balance) => {
    const isDeposit = type === 'deposit';
    return sendEmail(
      email,
      `${isDeposit ? 'Deposit' : 'Withdrawal'} Alert - Moresave SACCO`,
      `Hello ${name}, a ${type} of UGX ${amount.toLocaleString()} has been recorded. Your new balance is UGX ${balance.toLocaleString()}.`,
      `<div style="font-family: Arial; padding: 20px; border: 1px solid #eee;">
         <h2 style="color: ${isDeposit ? '#27ae60' : '#c0392b'};">${type.toUpperCase()} ALERT</h2>
         <p>Hello <strong>${name}</strong>,</p>
         <p>A transaction has been recorded on your account:</p>
         <table style="width: 100%; border-collapse: collapse;">
           <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Type:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">${type.toUpperCase()}</td></tr>
           <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Amount:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">UGX ${amount.toLocaleString()}</td></tr>
           <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">New Balance:</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">UGX ${balance.toLocaleString()}</td></tr>
         </table>
       </div>`
    );
  }
};

module.exports = notifyMember;
