# MPESA Credentials Setup

## Quick Setup Guide

You've provided:
- ✅ Consumer Key: `62AFmN56IgSVTVxWJeYjn6C5QTgvtaMRN5Ux6nnUFRF0zIXq`
- ✅ Consumer Secret: `fkHAhv4Vr3dGnWiC2v3nu8izLy4E12KoV4vE6JS0Dn6s2wuBtRs0Jk6gTGxz8JG0`

## Still Need:

1. **Business Short Code** (Paybill/Till Number)
   - For Sandbox: Usually `174379`
   - For Production: Your actual Paybill number

2. **Passkey** 
   - Found in Daraja Developer Portal
   - Under your app's "Confirmation & Validation URLs" section

3. **Callback URL**
   - Must be publicly accessible
   - For local: Use ngrok (e.g., `https://abc123.ngrok.io/api/payments/mpesa/callback`)
   - For production: Your domain (e.g., `https://stegasheild.com/api/payments/mpesa/callback`)

## Step 1: Create/Update `.env` file

Create `server/.env` file with:

```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production

# MPESA Daraja API Configuration
MPESA_CONSUMER_KEY=62AFmN56IgSVTVxWJeYjn6C5QTgvtaMRN5Ux6nnUFRF0zIXq
MPESA_CONSUMER_SECRET=fkHAhv4Vr3dGnWiC2v3nu8izLy4E12KoV4vE6JS0Dn6s2wuBtRs0Jk6gTGxz8JG0
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=YOUR_PASSKEY_HERE
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox

# Currency Exchange (USD to KES)
EXCHANGE_RATE=140
```

## Step 2: Get Missing Credentials

### Option A: Sandbox (Testing)
1. Go to: https://developer.safaricom.co.ke/
2. Login with your account
3. Navigate to your app
4. Find "Confirmation & Validation URLs" section
5. Copy the Passkey

### Option B: Check Daraja Portal
- Login: https://developer.safaricom.co.ke/user/login
- Go to "My Apps"
- Click on your app
- Check "App Credentials" section
- Business Short Code and Passkey are shown there

## Step 3: Setup Callback URL (Local Development)

### Using ngrok (Recommended for Local Testing):

1. Install ngrok: https://ngrok.com/download

2. Start your server:
```bash
cd server
npm start
```

3. In another terminal, start ngrok:
```bash
ngrok http 3001
```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Update `.env`:
```env
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/mpesa/callback
```

6. Update callback URL in Daraja Portal:
   - Go to your app settings
   - Update "Confirmation URL" to your ngrok URL + `/api/payments/mpesa/callback`

## Step 4: Restart Server

```bash
cd server
npm start
```

## Testing

1. Login to dashboard
2. Go to Profile & Billing
3. Click "Upgrade" on a plan
4. Select "MPESA" payment method
5. Enter phone number: `254708374149` (sandbox test number)
6. Click "Pay with MPESA"
7. Check your phone - you should receive an MPESA prompt!

## Important Notes

⚠️ **Security:**
- Never commit `.env` file
- Keep credentials secure
- Use different credentials for production

📱 **Phone Number Format:**
- Must include country code: `254XXXXXXXXX`
- Example: `254712345678`

🔄 **Environment:**
- `MPESA_ENVIRONMENT=sandbox` for testing
- `MPESA_ENVIRONMENT=production` for live payments

