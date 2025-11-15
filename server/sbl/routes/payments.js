import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { dbHelpers } from '../database/db.js';
import { createLog } from '../utils/logger.js';
import { initiateSTKPush, querySTKPushStatus } from '../utils/mpesa.js';

const router = express.Router();

// Get plans
router.get('/plans', (req, res) => {
  try {
    const plans = dbHelpers.getAllPlans();
    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's current plan
router.get('/plan', authenticateToken, (req, res) => {
  try {
    const user = dbHelpers.getUserById(req.user.userId);
    const plan = dbHelpers.getPlanById(user.plan_id);
    res.json({ plan });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create payment (MPESA, Stripe, PayPal)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { plan_id, payment_method, phone_number, transaction_code } = req.body;
    const userId = req.user.userId;

    if (!plan_id || !payment_method) {
      return res.status(400).json({ error: 'Plan ID and payment method are required' });
    }

    const plan = dbHelpers.getPlanById(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // For MPESA, phone number is required
    if (payment_method === 'MPESA' && !phone_number) {
      return res.status(400).json({ error: 'Phone number is required for MPESA payments' });
    }

    // Create payment record
    const paymentId = dbHelpers.createPayment({
      user_id: userId,
      plan_id,
      amount: plan.price,
      payment_method,
      transaction_code: transaction_code || null,
      status: 'Pending'
    });

    // Log activity
    createLog({
      user_id: userId,
      action: 'Payment created',
      ip_address: req.ip,
      details: JSON.stringify({ payment_id: paymentId, plan_id, payment_method, phone_number })
    });

    // Handle MPESA STK Push (Real Daraja API Integration)
    if (payment_method === 'MPESA') {
      try {
        // Convert USD to KES (assuming 1 USD = 140 KES, adjust as needed)
        const exchangeRate = parseFloat(process.env.EXCHANGE_RATE || '140');
        const amountKES = Math.ceil(plan.price * exchangeRate);
        
        // Initiate real STK Push via Safaricom Daraja API
        const stkResponse = await initiateSTKPush(
          phone_number,
          amountKES,
          `STEGASHIELD-${paymentId}`, // Account Reference
          `Payment for ${plan.plan_name} plan` // Transaction Description
        );

        if (stkResponse.success) {
          // Store checkout request ID in payment record (we'll need this for callback)
          dbHelpers.updatePayment(paymentId, {
            transaction_code: stkResponse.checkoutRequestID // Temporarily store checkout ID
          });

          // Log activity
          createLog({
            user_id: userId,
            action: 'MPESA STK Push initiated',
            ip_address: req.ip,
            details: JSON.stringify({ 
              payment_id: paymentId, 
              checkout_request_id: stkResponse.checkoutRequestID,
              phone_number,
              amount_kes: amountKES
            })
          });

          res.json({
            message: stkResponse.customerMessage || 'MPESA STK Push initiated. Please complete payment on your phone.',
            payment_id: paymentId,
            checkout_request_id: stkResponse.checkoutRequestID,
            merchant_request_id: stkResponse.merchantRequestID,
            phone_number: phone_number,
            amount: amountKES,
            amount_usd: plan.price,
            instructions: `Check your phone (${phone_number}) for an MPESA prompt to complete payment of KES ${amountKES}`
          });
        } else {
          throw new Error(stkResponse.responseDescription || 'Failed to initiate STK Push');
        }
      } catch (error) {
        console.error('MPESA STK Push Error:', error);
        
        // Update payment status to Failed
        dbHelpers.updatePayment(paymentId, {
          status: 'Failed'
        });

        // Log error
        createLog({
          user_id: userId,
          action: 'MPESA payment failed',
          ip_address: req.ip,
          details: JSON.stringify({ 
            payment_id: paymentId, 
            error: error.message 
          })
        });

        res.status(400).json({
          error: 'Failed to initiate MPESA payment',
          message: error.message || 'Please check your phone number and try again'
        });
      }
      return; // Exit early for MPESA
    } else {
      res.json({
        message: 'Payment created',
        payment_id: paymentId,
        payment_url: payment_method === 'Stripe' || payment_method === 'PayPal' ? `https://payment.gateway.com/pay/${paymentId}` : null
      });
    }
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm payment (webhook or callback)
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { payment_id, status, transaction_code } = req.body;
    const userId = req.user.userId;

    if (!payment_id || !status) {
      return res.status(400).json({ error: 'Payment ID and status are required' });
    }

    // Get payment
    const payments = dbHelpers.getPaymentsByUser(userId);
    const payment = payments.find(p => p.payment_id === payment_id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment
    const updates = { status };
    if (transaction_code) updates.transaction_code = transaction_code;
    dbHelpers.updatePayment(payment_id, updates);

    // If payment successful, update user's plan
    if (status === 'Successful') {
      dbHelpers.updateUser(userId, { plan_id: payment.plan_id });

      // Log activity
      createLog({
        user_id: userId,
        action: 'Payment confirmed',
        ip_address: req.ip,
        details: JSON.stringify({ payment_id, plan_id: payment.plan_id })
      });
    }

    res.json({ message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's payments
router.get('/history', authenticateToken, (req, res) => {
  try {
    const payments = dbHelpers.getPaymentsByUser(req.user.userId);
    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MPESA Callback/Webhook (called by Safaricom when payment is completed)
router.post('/mpesa/callback', (req, res) => {
  try {
    const { Body } = req.body;
    const stkCallback = Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('Invalid MPESA callback:', req.body);
      // Still acknowledge to Safaricom to avoid retries
      return res.json({ ResultCode: 0, ResultDesc: 'Callback received' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    console.log('MPESA Callback received:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    });

    // Find payment by checkout request ID (stored in transaction_code)
    const payment = dbHelpers.getPaymentByTransactionCode(CheckoutRequestID);

    if (!payment) {
      console.error('Payment not found for checkout request:', CheckoutRequestID);
      // Still acknowledge to Safaricom
      return res.json({ ResultCode: 0, ResultDesc: 'Callback received' });
    }

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;

      // Update payment status
      dbHelpers.updatePayment(payment.payment_id, {
        status: 'Successful',
        transaction_code: mpesaReceiptNumber
      });

      // Update user's plan
      dbHelpers.updateUser(payment.user_id, { plan_id: payment.plan_id });

      // Log activity
      createLog({
        user_id: payment.user_id,
        action: 'MPESA payment confirmed',
        ip_address: req.ip,
        details: JSON.stringify({
          payment_id: payment.payment_id,
          mpesa_receipt_number: mpesaReceiptNumber,
          phone_number: phoneNumber,
          amount,
          transaction_date: transactionDate
        })
      });

      console.log('MPESA payment confirmed:', {
        payment_id: payment.payment_id,
        mpesa_receipt_number: mpesaReceiptNumber,
        amount
      });
    } else {
      // Payment failed or cancelled
      dbHelpers.updatePayment(payment.payment_id, {
        status: 'Failed'
      });

      createLog({
        user_id: payment.user_id,
        action: 'MPESA payment failed',
        ip_address: req.ip,
        details: JSON.stringify({
          payment_id: payment.payment_id,
          result_code: ResultCode,
          result_desc: ResultDesc
        })
      });

      console.log('MPESA payment failed:', {
        payment_id: payment.payment_id,
        result_code: ResultCode,
        result_desc: ResultDesc
      });
    }

    // Acknowledge receipt to Safaricom
    res.json({
      ResultCode: 0,
      ResultDesc: 'Callback received and processed'
    });
  } catch (error) {
    console.error('MPESA Callback Error:', error);
    // Still acknowledge to avoid retries
    res.json({
      ResultCode: 0,
      ResultDesc: 'Callback received but error processing'
    });
  }
});

// Query STK Push status (for checking payment status)
router.post('/mpesa/query', authenticateToken, async (req, res) => {
  try {
    const { checkout_request_id } = req.body;

    if (!checkout_request_id) {
      return res.status(400).json({ error: 'Checkout request ID is required' });
    }

    const status = await querySTKPushStatus(checkout_request_id);
    res.json(status);
  } catch (error) {
    console.error('Query STK Push Error:', error);
    res.status(500).json({ error: 'Failed to query transaction status' });
  }
});

export default router;






