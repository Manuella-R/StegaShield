# StegaShield 1.5

🛡️ Invisible watermarking and deepfake detection platform for digital media authenticity and trust.

## Features

### For General Users
- 🏠 **Landing Page** - Overview of StegaShield with visual demos
- 🔐 **User Authentication** - Secure sign up/login (email, Google, or institutional account)
- 📊 **User Dashboard** - Upload media, view processing history, and authenticity reports
- 💧 **Watermark Embedding** - Upload images/videos and add invisible watermarks
- 🔍 **Verification & Tamper Detection** - Check media authenticity and detect deepfakes
- 📋 **Reports & History** - Access all upload/verification logs with downloadable reports
- 👤 **User Profile Management** - Update personal info, manage subscription, and security settings
- 💳 **Subscription & Payment System** - Tiered plans with MPESA, Stripe, PayPal, and Flutterwave support
- 📚 **Help & Education Section** - FAQs, tutorials, and resources

### For Admins / Developers
- 👥 **User Management** - View, verify, or ban users
- 🤖 **Model & Dataset Management** - Upload, update, or switch watermarking models
- 💰 **Payment & Subscription Control** - Manage subscriptions and payments
- 📊 **Analytics Dashboard** - Monitor usage, accuracy, and revenue
- 🔒 **Security & Privacy** - Manage encryption keys and audit logs
- 📝 **Activity Logs** - Track all actions and system events

## Tech Stack

### Frontend
- React 19
- React Router
- Vite
- Recharts (for analytics)

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- JWT Authentication
- Multer (file uploads)
- bcryptjs (password hashing)

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

   Set the integration URL, for example:
   ```
   MODEL_SERVICE_URL=http://localhost:8001
   ```

4. Initialize the database:
```bash
npm run init-db
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend API will run on `http://localhost:3001`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Set `VITE_API_URL=http://localhost:3001/api`

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Watermark Model Integration

The production watermark pipeline is now exposed through a lightweight FastAPI microservice located in `stegashield_model - Copy/api/app.py`. The Node backend talks to this service via HTTP, so you can scale or host it independently if needed.

1. Install Python 3.10+ and the model dependencies:
   ```bash
   cd ../stegashield_model\ -\ Copy
   pip install -r requirements.txt
   ```
2. Start the FastAPI model server (in a new terminal):
   ```bash
   uvicorn api.app:app --host 0.0.0.0 --port 8001
   ```
   You can set `MODEL_SERVICE_HOST`, `MODEL_SERVICE_PORT`, or `MODEL_SERVICE_RELOAD=true` as needed.
3. Point the Node backend to the FastAPI instance by setting the following in `server/.env`:
   ```
   MODEL_SERVICE_URL=http://localhost:8001
   ```
   (Optional fallback) If you prefer the direct CLI integration instead, leave `MODEL_SERVICE_URL` unset and optionally set `MODEL_PYTHON=/path/to/python`.
4. Run the backend as usual. The `/api/watermark/embed` and `/api/watermark/verify` routes now proxy to FastAPI, write all artifacts under `server/uploads`, and return shareable file URLs.
5. Download and store the metadata JSON returned during embedding. Verification **requires** uploading that metadata file alongside the suspect image so the verifier can reconstruct the payload.

If the CLI or dependencies are missing, the API will respond with a descriptive error.

## Database Schema

The application uses SQLite with the following tables:

- **users** - User accounts and profiles
- **plans** - Subscription plans and pricing
- **payments** - Payment transactions
- **uploads** - Media file uploads
- **verification_reports** - Verification results
- **activity_logs** - Activity audit logs

See `server/database/schema.sql` for the complete schema.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/forgot-password` - Request password reset

### Watermarking
- `POST /api/watermark/embed` - Embed watermark
- `POST /api/watermark/verify` - Verify watermark
- `GET /api/watermark/uploads` - Get user uploads
- `GET /api/watermark/reports` - Get verification reports

### Payments
- `GET /api/payments/plans` - Get all plans
- `GET /api/payments/plan` - Get current plan
- `POST /api/payments/create` - Create payment
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId` - Update user
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/logs` - Get activity logs
- `GET /api/admin/payments` - Get all payments
- `GET /api/admin/plans` - Get all plans
- `POST /api/admin/plans` - Create plan
- `PUT /api/admin/plans/:planId` - Update plan

## Default Admin Account

The database is initialized with a default admin account:
- Email: `admin@stegasheild.com`
- Password: `admin123` (⚠️ Change this in production!)

## Environment Variables

### Backend (`server/.env`)
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - JWT secret key
- `DB_PATH` - Database file path
- `UPLOAD_DIR` - File upload directory
- Payment gateway credentials (MPESA, Stripe, PayPal, Flutterwave)

### Frontend (`.env`)
- `VITE_API_URL` - Backend API URL
- Firebase configuration (optional)

## Development

### Running in Development Mode

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
npm run dev
```

### Building for Production

1. Build the frontend:
```bash
npm run build
```

2. The built files will be in the `dist` directory.

## Project Structure

```
Stegasheild_1.5/
├── server/                 # Backend API
│   ├── database/         # Database schema and initialization
│   ├── middleware/       # Authentication and upload middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── src/                  # Frontend React app
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth, Theme)
│   ├── pages/            # Page components
│   ├── styles/           # Styling files
│   ├── utils/            # Utility functions
│   └── main.jsx          # Entry point
├── public/               # Static assets
└── package.json          # Frontend dependencies
```

## Features Implementation Status

✅ User authentication and authorization
✅ Watermark embedding and verification
✅ User dashboard and profile management
✅ Subscription plans and payment system
✅ Admin dashboard and user management
✅ Analytics and reporting
✅ Activity logs and audit trails
✅ Help & education section
✅ Dark mode toggle
⏳ Payment gateway integration (MPESA, Stripe, PayPal)
⏳ Two-factor authentication
⏳ Email verification
⏳ File storage (currently local, should be cloud storage)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Copyright © 2025 StegaShield. All rights reserved.

## Support

For support, please contact [support@stegasheild.com](mailto:support@stegasheild.com) or visit the Help & Education section in the dashboard.

## Acknowledgments

- React team for the amazing framework
- Express.js for the backend framework
- SQLite for the database
- All contributors and users
