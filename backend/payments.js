// payments.js - MTN MoMo and Airtel Money integration (basic structure)
// You need to set up your API keys and endpoints from MTN/Airtel developer portals

const axios = require('axios');
const express = require('express');
const router = express.Router();

// Example: MTN MoMo API credentials (replace with your real values)
const MTN_MOMO_PRIMARY_KEY = process.env.MTN_MOMO_PRIMARY_KEY;
const MTN_MOMO_BASE_URL = 'https://sandbox.momodeveloper.mtn.com';

// Example: Airtel Money API credentials (replace with your real values)
const AIRTEL_API_KEY = process.env.AIRTEL_API_KEY;
const AIRTEL_API_SECRET = process.env.AIRTEL_API_SECRET;
const AIRTEL_BASE_URL = 'https://openapi.airtel.africa';

// Initiate MTN MoMo payment
// In-memory payment store (replace with DB in production)

const db = require('./db');
const { requireAdmin } = require('./middleware/auth');

// Load environment variables for payment API credentials
const MTN_MOMO_API_KEY = process.env.MTN_MOMO_API_KEY;
const MTN_MOMO_API_SECRET = process.env.MTN_MOMO_API_SECRET;
const AIRTEL_MONEY_API_KEY = process.env.AIRTEL_MONEY_API_KEY;
const AIRTEL_MONEY_API_SECRET = process.env.AIRTEL_MONEY_API_SECRET;

// Helper: calculate expiry date
function getExpiry(duration) {
  const now = new Date();
  switch (duration) {
    case 'day':
      now.setDate(now.getDate() + 1);
      break;
    case 'month':
      now.setMonth(now.getMonth() + 1);
      break;
    case '3months':
      now.setMonth(now.getMonth() + 3);
      break;
    case '6months':
      now.setMonth(now.getMonth() + 6);
      break;
    case 'year':
      now.setFullYear(now.getFullYear() + 1);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  return now;
}

// Helper: get amount for duration
const getAmount = (duration) => {
  switch (duration) {
    case 'day': return 1000;
    case 'month': return 20000;
    case '3months': return 50000;
    case '6months': return 90000;
    case 'year': return 150000;
    default: return 1000;
  }
};

// Helper: initiate payment with MTN MoMo (real API integration)
async function initiateMTNMoMoPayment({ userId, amount }) {
  try {
    // 1. Get API user token
    const tokenRes = await axios.post(
      `${MTN_MOMO_BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': MTN_MOMO_PRIMARY_KEY,
          Authorization: `Basic ${Buffer.from(`${MTN_MOMO_API_KEY}:${MTN_MOMO_API_SECRET}`).toString('base64')}`,
        },
      }
    );
    const accessToken = tokenRes.data.access_token;

    // 2. Create a unique transaction ID
    const transactionId = `mtn-${userId}-${Date.now()}`;

    // 3. Initiate payment request
    const paymentRes = await axios.post(
      `${MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency: 'UGX',
        externalId: transactionId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: userId.toString(),
        },
        payerMessage: 'Payment for subscription',
        payeeNote: 'Subscription',
      },
      {
        headers: {
          'X-Reference-Id': transactionId,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': MTN_MOMO_PRIMARY_KEY,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // 4. Return transactionId if successful
    return { success: true, transactionId };
  } catch (err) {
    console.error('MTN MoMo payment error:', err.response ? err.response.data : err.message);
    return { success: false, error: err.response ? err.response.data : err.message };
  }
}

// Helper: initiate payment with Airtel Money (real API integration)
async function initiateAirtelMoneyPayment({ userId, amount }) {
  try {
    // 1. Get access token
    const tokenRes = await axios.post(
      `${AIRTEL_BASE_URL}/auth/oauth2/token`,
      {
        client_id: AIRTEL_API_KEY,
        client_secret: AIRTEL_API_SECRET,
        grant_type: 'client_credentials',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const accessToken = tokenRes.data.access_token;

    // 2. Create a unique transaction ID
    const transactionId = `airtel-${userId}-${Date.now()}`;

    // 3. Initiate payment request
    const paymentRes = await axios.post(
      `${AIRTEL_BASE_URL}/merchant/v1/payments/`,
      {
        reference: transactionId,
        subscriber: {
          country: 'UG',
          currency: 'UGX',
          msisdn: userId.toString(),
        },
        transaction: {
          amount: amount.toString(),
          country: 'UG',
          currency: 'UGX',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // 4. Return transactionId if successful
    return { success: true, transactionId };
  } catch (err) {
    console.error('Airtel Money payment error:', err.response ? err.response.data : err.message);
    return { success: false, error: err.response ? err.response.data : err.message };
  }
}

// POST /pay
// { userId, provider, duration }
// provider: 'mtn' | 'airtel'
// Wrap pay endpoint with admin check and input validation
exports.pay = [
  requireAdmin,
  async (req, res) => {
    const { userId, provider, duration } = req.body;
    if (!userId || !provider || !duration) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (!['mtn', 'airtel'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    if (!['day', 'month', '3months', '6months', 'year'].includes(duration)) {
      return res.status(400).json({ error: 'Invalid duration' });
    }
    const amount = getAmount(duration);
    const expiry = getExpiry(duration);
    let paymentResult;
    if (provider === 'mtn') {
      paymentResult = await initiateMTNMoMoPayment({ userId, amount });
    } else if (provider === 'airtel') {
      paymentResult = await initiateAirtelMoneyPayment({ userId, amount });
    }
    if (!paymentResult.success) {
      return res.status(500).json({ error: 'Payment initiation failed' });
    }
    // Store payment in MySQL
    db.query(
      'INSERT INTO payments (userId, provider, amount, expiry, paid, transactionId) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE provider=VALUES(provider), amount=VALUES(amount), expiry=VALUES(expiry), paid=VALUES(paid), transactionId=VALUES(transactionId)',
      [userId, provider, amount, expiry, true, paymentResult.transactionId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'DB error', details: err });
        }
        return res.json({ success: true, expiry, transactionId: paymentResult.transactionId });
      }
    );
  }
];

// GET /payment-status?userId=xxx
exports.status = (req, res) => {
  const { userId } = req.query;
  db.query('SELECT * FROM payments WHERE userId = ? AND paid = 1', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'DB error', details: err });
    }
    if (!results.length) {
      return res.json({ paid: false });
    }
    const payment = results[0];
    const now = new Date();
    if (now > new Date(payment.expiry)) {
      // Expired, update DB
      db.query('UPDATE payments SET paid = 0 WHERE userId = ?', [userId]);
      return res.json({ paid: false });
    }
    return res.json({ paid: true, expiry: payment.expiry, transactionId: payment.transactionId });
  });
};
