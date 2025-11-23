# MPESA Daraja API Setup Guide

## Required Credentials

To enable real MPESA STK Push, you need the following from Safaricom Daraja API:

### ✅ Already Provided:
- **Consumer Key**: `62AFmN56IgSVTVxWJeYjn6C5QTgvtaMRN5Ux6nnUFRF0zIXq`
- **Consumer Secret**: `fkHAhv4Vr3dGnWiC2v3nu8izLy4E12KoV4vE6JS0Dn6s2wuBtRs0Jk6gTGxz8JG0`

### ❌ Still Needed:
1. **Business Short Code** - Your MPESA Paybill/Till number (e.g., `174379` for sandbox)
2. **Passkey** - Your Daraja app Passkey (from Daraja developer portal)
3. **Callback URL** - Public URL where Safaricom will send payment confirmations

## Getting Missing Credentials

### For Sandbox (Testing):
1. Go to: https://developer.safaricom.co.ke/
2. Register/login to Daraja Developer Portal
3. Create a new app or use existing app
4. Get your credentials:
   - **Business Short Code**: `174379` (sandbox default)
   - **Passkey**: Found in your app's "Confirmation & Validation URLs" section
   - **Test Phone Number**: Use `254708374149` for sandbox testing

### For Production:
1. Complete Safaricom Daraja onboarding
2. Get your production Business Short Code (Paybill number)
3. Configure your app with production credentials
4. Set up callback URL on a publicly accessible server

## Setup Steps

### 1. Create `.env` file in `server/` directory

```bash
cd server
# Create .env file or edit existing one
```

### 2. Add MPESA credentials to `.env`:

```env
# MPESA Daraja API Configuration
MPESA_CONSUMER_KEY=62AFmN56IgSVTVxWJeYjn6C5QTgvtaMRN5Ux6nnUFRF0zIXq
MPESA_CONSUMER_SECRET=fkHAhv4Vr3dGnWiC2v3nu8izLy4E12KoV4vE6JS0Dn6s2wuBtRs0Jk6gTGxz8JG0
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox

# Currency Exchange Rate (USD to KES)
EXCHANGE_RATE=140
```

### 3. Get Your Passkey

For **Sandbox**:
- Go to: https://developer.safaricom.co.ke/
- Login to your account
- Navigate to your app
- Check "Confirmation & Validation URLs" section
- The Passkey is shown there (usually a long string)

For **Production**:
- The Passkey is provided by Safaricom after app approval

### 4. Configure Callback URL

**For Local Development (using ngrok):**
```bash
# Install ngrok
# Run: ngrok http 3001
# Copy the https URL (e.g., https://abc123.ngrok.io)
# Set in .env: MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/payments/mpesa/callback
```

**For Production:**
```env
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
```

### 5. Restart Server

After updating `.env`, restart your server:
```bash
cd server
npm start
```

## How It Works

1. **User initiates payment** → Frontend sends payment request
2. **Backend initiates STK Push** → Calls Safaricom Daraja API
3. **Safaricom sends prompt** → User sees MPESA prompt on phone
4. **User completes payment** → Enters PIN on phone
5. **Safaricom sends callback** → POST to `/api/payments/mpesa/callback`
6. **Payment confirmed** → User's plan is upgraded automatically

## Testing

### Sandbox Testing:
1. Use test phone number: `254708374149`
2. Make sure your callback URL is publicly accessible (use ngrok for local testing)
3. Initiate a payment through the dashboard
4. You should receive an MPESA prompt on the test phone

### Production:
1. Use real phone numbers (format: 254XXXXXXXXX)
2. Set `MPESA_ENVIRONMENT=production` in `.env`
3. Use production Business Short Code
4. Ensure callback URL is publicly accessible

## Troubleshooting

### "Failed to authenticate with MPESA API"
- Check Consumer Key and Consumer Secret
- Verify credentials in Daraja developer portal

### "Invalid phone number format"
- Use format: 254XXXXXXXXX (e.g., 254712345678)
- Include country code (254 for Kenya)

### "Callback not received"
- Ensure callback URL is publicly accessible
- For local testing, use ngrok or similar tool
- Check server logs for callback attempts

### "STK Push failed"
- Verify Business Short Code is correct
- Check Passkey matches your app configuration
- Ensure account has sufficient balance (sandbox) or is active (production)

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to version control
- Use environment variables for all credentials
- Keep credentials secure and rotate regularly
- Use HTTPS for callback URLs in production

## Additional Resources

- Safaricom Daraja API Docs: https://developer.safaricom.co.ke/APIs
- Sandbox Credentials: https://developer.safaricom.co.ke/test_credentials
- STK Push Documentation: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate

