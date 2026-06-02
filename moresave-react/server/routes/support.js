const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ticketsPath = path.join(__dirname, '../support_tickets.json');
const configPath = path.join(__dirname, '../config.json');

// Initialize tickets file if missing
if (!fs.existsSync(ticketsPath)) {
  fs.writeFileSync(ticketsPath, JSON.stringify([], null, 2));
}

const loadTickets = () => JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
const saveTickets = (data) => fs.writeFileSync(ticketsPath, JSON.stringify(data, null, 2));

const getAISetting = () => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.support?.aiEnabled !== false; // Default AI ON
  } catch { return true; }
};

// ─── AI RESPONSE ENGINE ────────────────────────────────────────────────────
const aiRespond = (message) => {
  const msg = message.toLowerCase();

  if (msg.match(/loan|borrow|credit/)) {
    return `Thank you for your inquiry! 🏦\n\nAt Moresave SACCO, you can apply for a loan if you meet the following criteria:\n• You must be an active member for at least 3 months\n• Your loan can be up to 3x your current savings balance\n• Repayment periods range from 6 to 36 months\n• Monthly interest rate is 2%\n\nTo apply, go to **Apply for Loan** in your dashboard. A loan officer will review your application within 2-3 working days. Is there anything else I can help you with?`;
  }
  if (msg.match(/saving|deposit|account|balance/)) {
    return `Hello! 💰\n\nYour Moresave SACCO savings account information:\n• You can make deposits at any of our offices or via Mobile Money (MTN/Airtel)\n• The minimum monthly saving is UGX 20,000\n• There is no limit on deposit amounts\n• You can view your current balance and full transaction history in the **Transactions** section of your dashboard\n\nFor any deposit-related queries, please contact our cashier desk or visit us in person. Anything else?`;
  }
  if (msg.match(/dividend|profit|share|interest/)) {
    return `Great question about dividends! 📈\n\nMoresave SACCO distributes dividends annually based on:\n• Your average savings balance for the financial year\n• Your proportional share of total SACCO savings\n• The overall SACCO profit for that year\n\nYou can view your dividend history in the **My Dividends** section of your dashboard. Dividends are typically approved and paid out in January each year. Need more help?`;
  }
  if (msg.match(/withdraw|withdrawal/)) {
    return `For withdrawals from your account: 💳\n\n• You can request a withdrawal through your member dashboard\n• All withdrawal requests are reviewed and approved by SACCO staff within 1 working day\n• Minimum withdrawal is UGX 5,000\n• Note: Outstanding loan balances may affect your withdrawal eligibility\n\nWould you like help with anything else?`;
  }
  if (msg.match(/password|login|access|forgot|reset/)) {
    return `Having trouble accessing your account? 🔐\n\nHere's what you can do:\n• Your initial login credentials were provided when your membership was approved\n• You can update your password anytime in **My Profile → Change Password**\n• If you are completely locked out, please contact our office directly or visit in person with your member ID card\n\nIs there anything else I can assist you with?`;
  }
  if (msg.match(/contact|phone|office|address|location|hours/)) {
    return `Here is how to reach us: 📞\n\n**Moresave SACCO**\n• Office Hours: Monday – Friday, 8:00 AM – 5:00 PM\n• Saturday: 9:00 AM – 1:00 PM\n• Phone: +256 700 000000\n• Email: info@moresave.co.ug\n\nYou can also continue chatting here and a staff member will respond to you shortly. Is there anything else?`;
  }
  if (msg.match(/repay|payment|installment|due|overdue|penalty/)) {
    return `Regarding your loan repayments: 📅\n\n• Monthly installments are due on the same day each month as your disbursement date\n• You can view your repayment schedule under **My Loans**\n• Overdue payments attract a 2% monthly penalty on the outstanding amount\n• To make a repayment, please visit our cashier desk or deposit via Mobile Money and inform our loan officer\n\nStay on track and avoid penalties! Can I help with anything else?`;
  }
  if (msg.match(/hello|hi|hey|good morning|good afternoon|good evening|greet/)) {
    return `Hello! 👋 Welcome to Moresave SACCO Customer Support!\n\nI'm your virtual assistant. I'm here to help you with questions about:\n• 💰 Savings & Deposits\n• 🏦 Loans & Repayments\n• 📈 Dividends\n• 🔐 Account Access\n• 📞 Contact & Office Information\n\nPlease type your question and I'll do my best to help you right away!`;
  }
  if (msg.match(/thank|thanks|okay|ok|great|perfect|alright/)) {
    return `You're welcome! 😊 We're always happy to help at Moresave SACCO. If you have any more questions in the future, don't hesitate to reach out. Have a wonderful day!`;
  }

  // Default fallback
  return `Thank you for contacting Moresave SACCO Support! 🙏\n\nI've received your message and a staff member will review it and respond to you shortly during office hours (Mon–Fri, 8AM–5PM).\n\nFor urgent matters, please call us at **+256 700 000000**.\n\nIs there anything specific I can try to help you with right now?`;
};
// ──────────────────────────────────────────────────────────────────────────

// GET all tickets (admin) or a specific member's ticket
router.get('/', (req, res) => {
  const { memberNumber } = req.query;
  const tickets = loadTickets();
  if (memberNumber) {
    const ticket = tickets.find(t => t.memberNumber === memberNumber);
    res.json(ticket || { memberNumber, messages: [] });
  } else {
    // Return summary for admin
    const summary = tickets.map(t => ({
      memberNumber: t.memberNumber,
      memberName: t.memberName,
      lastMessage: t.messages[t.messages.length - 1],
      unread: t.messages.filter(m => m.sender === 'member' && !m.read).length
    }));
    res.json(summary);
  }
});

// POST - send a new message
router.post('/message', (req, res) => {
  const { memberNumber, memberName, message, sender } = req.body;
  if (!memberNumber || !message || !sender) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const tickets = loadTickets();
  let ticket = tickets.find(t => t.memberNumber === memberNumber);

  if (!ticket) {
    ticket = { memberNumber, memberName: memberName || memberNumber, messages: [] };
    tickets.push(ticket);
  }

  const newMsg = {
    id: Date.now(),
    sender,
    text: message,
    timestamp: new Date().toISOString(),
    read: sender !== 'member'
  };
  ticket.messages.push(newMsg);

  // If member sent the message AND AI is enabled, auto-respond
  if (sender === 'member' && getAISetting()) {
    const aiReply = {
      id: Date.now() + 1,
      sender: 'ai',
      text: aiRespond(message),
      timestamp: new Date().toISOString(),
      read: false
    };
    ticket.messages.push(aiReply);
  }

  saveTickets(tickets);
  res.json({ success: true, messages: ticket.messages });
});

// POST - staff reply
router.post('/reply', (req, res) => {
  const { memberNumber, message, staffName } = req.body;
  const tickets = loadTickets();
  const ticket = tickets.find(t => t.memberNumber === memberNumber);

  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  ticket.messages.push({
    id: Date.now(),
    sender: 'staff',
    staffName: staffName || 'Support Staff',
    text: message,
    timestamp: new Date().toISOString(),
    read: false
  });

  saveTickets(tickets);
  res.json({ success: true, messages: ticket.messages });
});

// PATCH - mark messages as read
router.patch('/read', (req, res) => {
  const { memberNumber } = req.body;
  const tickets = loadTickets();
  const ticket = tickets.find(t => t.memberNumber === memberNumber);
  if (ticket) {
    ticket.messages.forEach(m => { m.read = true; });
    saveTickets(tickets);
  }
  res.json({ success: true });
});

module.exports = router;
