# StegaShield 1.5 - Complete Documentation

## 🎯 Overview

**StegaShield** is an invisible watermarking and deepfake detection platform designed to protect digital media authenticity and establish trust in digital content. The platform provides users with tools to embed invisible watermarks into images, verify media authenticity, detect tampering, and identify potential deepfakes.

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19, React Router, Vite
- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT tokens, bcryptjs
- **File Uploads**: Multer
- **OAuth**: Firebase Authentication (Google, GitHub)
- **Payments**: MPESA STK Push, Stripe, PayPal, Flutterwave
- **2FA**: TOTP via otplib

### Project Structure
```
Stegasheild_1.5/
├── src/                    # Frontend React application
│   ├── pages/             # Page components
│   ├── components/        # Reusable components
│   ├── utils/             # Utilities (API, helpers)
│   ├── styles/            # Styling files
│   └── AuthContext.jsx    # Authentication context
├── server/                 # Backend Node.js application
│   ├── routes/            # API route handlers
│   ├── database/          # Database schema and helpers
│   ├── middleware/        # Auth, upload middleware
│   └── utils/             # Backend utilities
└── database/              # SQLite database files
```

---

## 🔐 Authentication & Security

### User Authentication
1. **Email/Password Login**: Traditional authentication with bcrypt password hashing
2. **OAuth Login**: 
   - Google Sign-In via Firebase
   - GitHub Sign-In via Firebase
   - Automatic user creation for first-time OAuth users
3. **Two-Factor Authentication (2FA)**:
   - TOTP-based using authenticator apps (Google Authenticator, Authy)
   - Optional for all users
   - Can be enabled/disabled from profile
   - OAuth users can enable 2FA without password requirement
   - Required during login if enabled

### Security Features
- JWT token-based session management
- Password hashing with bcryptjs (salt rounds: 10)
- Protected routes with authentication middleware
- Role-based access control (user, admin, developer, moderator)
- Activity logging for security auditing
- IP address tracking in logs

---

## 👤 User Management

### User Roles
- **user**: Regular users with plan-based access
- **admin**: Full system access and management
- **developer**: Development and testing access
- **moderator**: Content moderation capabilities

### User Features
- Profile management (name, email, phone, profile picture)
- Password change (for non-OAuth users)
- 2FA setup and management
- Plan subscription and upgrades
- Activity history tracking

---

## 💰 Subscription Plans & Payments

### Available Plans

#### Free Plan
- **Price**: $0.00
- **Uploads/Week**: 10
- **Features**: Basic LSB watermarking, simple verification
- **Watermark Types**: Basic only

#### Pro Plan
- **Price**: $9.99/month
- **Uploads/Week**: 100
- **Features**: Blind/non-blind watermarking, enhanced detection
- **Watermark Types**: Basic, Robust, Blind

#### Enterprise Plan
- **Price**: $29.99/month
- **Uploads/Week**: Unlimited
- **Features**: All watermark types, priority support, API access
- **Watermark Types**: All types (Basic, Robust, Blind, Custom)

### Payment Methods
1. **MPESA** (Kenya):
   - STK Push integration via Safaricom Daraja API
   - Real-time payment processing
   - Transaction status tracking

2. **Credit/Debit Cards**:
   - Stripe integration (ready for implementation)
   
3. **PayPal**:
   - PayPal payment gateway (ready for implementation)

4. **Flutterwave**:
   - African payment gateway (ready for implementation)

### Payment Flow
- User selects plan and payment method
- For MPESA: STK Push prompt sent to phone
- Payment status tracked in real-time
- Plan activated automatically on successful payment
- Receipt generated and stored

---

## 💧 Watermark Embedding

### Watermark Types

#### 1. Basic (LSB - Least Significant Bit)
- **Tier**: Free
- **Robustness**: Low
- **Visibility**: Invisible
- **Best For**: Simple use cases, low-risk content
- **Description**: Simple and fast, good for beginners. Visible under extreme compression.

#### 2. Robust (DWT/DCT - Discrete Wavelet/Discrete Cosine Transform)
- **Tier**: Paid (Pro+)
- **Robustness**: Medium
- **Visibility**: Invisible
- **Best For**: Most use cases, commercial content
- **Description**: Resistant to JPEG compression and resizing. Best for most use cases.

#### 3. Blind Watermarking
- **Tier**: Pro+
- **Robustness**: High
- **Visibility**: Invisible
- **Best For**: Distributed content verification
- **Description**: No original image needed for verification - Perfect for distributed content verification.

### Metadata Presets

#### Copyright Only
- Includes copyright notice with year
- Template: `© [YEAR] [YOUR NAME]`

#### Photographer
- Copyright + photographer name
- Template: `© [YEAR] [YOUR NAME] | Photographer: [PHOTOGRAPHER NAME]`

#### Newsroom Asset
- ID + timestamp + desk
- Template: `Newsroom ID: [ID] | Timestamp: [TIMESTAMP] | Desk: [DESK]`

#### Custom Presets
- Users can create and save custom metadata templates
- Stored in browser localStorage
- Can include placeholders: `[YEAR]`, `[PHOTOGRAPHER NAME]`, etc.

### Watermark Embedding Process
1. User uploads image (PNG, JPEG supported)
2. Selects watermark type (based on plan)
3. Chooses metadata preset or enters custom metadata
4. System embeds invisible watermark
5. Watermarked image returned for download
6. Upload record created in database
7. Activity logged

---

## 🔍 Verification & Tamper Detection

### Verification Process
1. User uploads image for verification
2. System analyzes image for watermark
3. Detects any tampering or manipulation
4. Generates authenticity report
5. Displays results with visual indicators

### Verification Results

#### Authenticity Status
- **Authentic** (Green): Image is original, watermark intact
- **Tampered** (Orange): Image modified, watermark partially detected
- **Deepfake Suspected** (Red): AI-generated or heavily manipulated

#### Confidence Score
- Displayed as progress bar/ring (0-100%)
- Color-coded:
  - Green (80-100%): High confidence
  - Orange (50-79%): Medium confidence
  - Red (0-49%): Low confidence

### Verification Report
Contains:
- Image hash (SHA-256 equivalent)
- Upload/User ID
- Date/Time stamp
- Expected watermark type
- Authenticity status
- Confidence score
- Suspected attack type
- Report ID

### Report Export
- **JSON Format**: Downloadable verification report as JSON
- **PDF Format**: Planned feature (coming soon)

---

## 🎮 Attack Playground (Lab Mode)

### Purpose
Interactive testing environment for users to understand watermark robustness and attack resistance.

### Features
1. **Watermark Embedding**: Embed watermark in uploaded image
2. **Pre-Attack Verification**: Verify image before applying attacks
3. **Attack Simulation**:
   - **JPEG Compression**: Adjustable quality slider (0-100)
   - **Resize/Crop**: Adjust width and height
   - **Noise Addition**: Add random noise (0-100 intensity)
   - **Blur**: Apply Gaussian blur (0-10 intensity)
4. **Post-Attack Verification**: Verify image after attack
5. **Comparison View**: Side-by-side before/after results

### Educational Value
- Learn which attacks affect watermark detection
- Understand watermark robustness
- Test different watermark types
- Compare attack resistance

---

## 📊 Activity History

### Features
- Complete history of all uploads and verifications
- Filter by operation type (embed, verify)
- Filter by date range
- View detailed report for each entry
- Flag incorrect reports
- Download individual reports

### Displayed Information
- Operation type (Embed/Verify)
- File name
- Watermark type (for embeddings)
- Authenticity status (for verifications)
- Confidence score
- Date/Time
- Actions (View, Flag, Download)

---

## 🚩 Report Flagging System

### User Flagging
- Users can flag verification reports they believe are incorrect
- Required to provide reason for flagging
- Flagged reports visible to admins
- Users can see status of their flagged reports

### Admin Review
- View all flagged reports
- See flagging reason and user
- Review original verification data
- Unflag reports if deemed correct
- Investigate flagged reports

---

## 🎫 Support Ticket System

### User Features
1. **Create Tickets**:
   - Subject and description
   - Category selection:
     - Bug Report
     - Feature Request
     - Account Issue
     - Payment Issue
     - Other
   - Priority level (low, medium, high, urgent)

2. **View Tickets**:
   - List of all user's tickets
   - Status tracking (pending, in_progress, resolved, closed)
   - View ticket details
   - Update ticket (add comments)

### Admin Features
1. **Ticket Management**:
   - View all tickets from all users
   - Filter by status, priority, category
   - Assign tickets to admins
   - Update ticket status
   - Add resolution notes
   - Close tickets
   - Delete tickets

2. **Status Workflow**:
   - pending → in_progress → resolved → closed

---

## 📢 Announcements System

### User View
- View published announcements
- Filter by date
- Read announcement details

### Admin Management
- Create announcements
- Set status (draft, published, archived)
- Edit announcements
- Delete announcements
- Publish/unpublish

---

## 👨‍💼 Admin Dashboard

### Analytics
- User statistics (total, active, new)
- Upload statistics (total, per week/month)
- Verification statistics
- Payment statistics
- Revenue tracking

### User Management
- **Search Users**: Search by name, email, or user ID
- **View Users**: See all user details, plan, activity
- **Update Plans**: Upgrade/downgrade user plans
- **Role Management**: Promote users to admin
- **Delete Users**: Remove user accounts (with safeguards)
- **Safeguards**: 
  - Cannot delete own account
  - Cannot remove own admin role

### Flagged Reports
- View all flagged verification reports
- See flagging details (user, reason, timestamp)
- Review verification data
- Unflag reports
- Investigate issues

### Plans Management
- View all subscription plans
- Update plan details (price, features, limits)
- Create new plans
- Manage plan features

### Models Management
- Manage watermarking models for embedding/verification
- Upload new models
- Switch active models
- View model performance

### Support Tickets
- Full ticket management system
- Assign tickets
- Track resolution
- Add resolutions

### Security Logs
- View all activity logs
- Filter by user, action, date
- IP address tracking
- Security event monitoring

---

## 🎨 User Experience Features

### Onboarding
- **First-Time Login Overlay**: 
  - 3-step guided tour
  - Step 1: "Start here: watermark an image"
  - Step 2: "Then test it in Verify"
  - Step 3: "Visit Support if you're stuck"
  - Shown once per user
  - Stored in localStorage

### UI/UX Enhancements
- Traffic light system for verification status (Green/Orange/Red)
- Progress bars/rings for confidence scores
- Loading states for all async operations
- Error handling with user-friendly messages
- Responsive design
- Dark theme with gold accents
- Smooth animations and transitions

### Navigation
- Sidebar navigation with clear sections
- User section (watermark, verify, history, profile, etc.)
- Admin section (separated, role-protected)
- Quick access to common features

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - Email/password login
- `POST /register` - User registration
- `POST /oauth` - OAuth login (Google/GitHub)
- `POST /verify-2fa` - Verify 2FA code during login
- `POST /2fa/setup` - Generate 2FA QR code
- `POST /2fa/enable` - Enable 2FA with verification code
- `POST /2fa/disable` - Disable 2FA (requires password for regular users)
- `GET /me` - Get current user data
- `PUT /profile` - Update user profile
- `PUT /password` - Change password
- `POST /forgot-password` - Request password reset

### Watermarking (`/api/watermark`)
- `POST /embed` - Embed watermark in image
- `POST /verify` - Verify image authenticity
- `GET /reports/:reportId` - Get verification report
- `POST /reports/:reportId/flag` - Flag a report
- `POST /reports/:reportId/unflag` - Unflag a report

### Payments (`/api/payments`)
- `GET /plans` - Get all subscription plans
- `POST /create` - Create payment (MPESA, Card, etc.)
- `GET /history` - Get user payment history
- `POST /mpesa/callback` - MPESA webhook callback
- `GET /mpesa/query/:checkoutRequestID` - Query MPESA status

### Admin (`/api/admin`)
- `GET /users?search=term` - Search/list users
- `DELETE /users/:userId` - Delete user
- `PUT /users/:userId` - Update user (plan, role)
- `GET /reports/flagged` - Get flagged reports
- `POST /reports/:reportId/unflag` - Unflag report
- `GET /tickets` - Get all tickets
- `GET /tickets/:ticketId` - Get ticket details
- `PUT /tickets/:ticketId` - Update ticket
- `DELETE /tickets/:ticketId` - Delete ticket
- `GET /announcements` - Get all announcements
- `POST /announcements` - Create announcement
- `PUT /announcements/:id` - Update announcement
- `DELETE /announcements/:id` - Delete announcement

### Tickets (`/api/tickets`)
- `POST /create` - Create support ticket
- `GET /my-tickets` - Get user's tickets
- `GET /:ticketId` - Get ticket details
- `PUT /:ticketId` - Update ticket

### Announcements (`/api/announcements`)
- `GET /published` - Get published announcements
- `GET /:id` - Get announcement details

---

## 🗄️ Database Schema

### Tables

#### users
- `user_id`, `name`, `email`, `phone_number`, `password_hash`
- `role`, `plan_id`, `profile_picture`
- `email_verified`, `two_factor_enabled`, `two_factor_secret`
- `created_at`, `updated_at`

#### plans
- `plan_id`, `plan_name`, `price`, `description`
- `max_uploads_per_week`, `features` (JSON)
- `created_at`

#### payments
- `payment_id`, `user_id`, `plan_id`, `amount`
- `payment_method`, `transaction_code`, `status`
- `payment_date`, `receipt_url`

#### uploads
- `upload_id`, `user_id`, `file_name`, `file_path`
- `operation_type`, `watermark_type`, `metadata` (JSON)
- `status`, `created_at`

#### verification_reports
- `report_id`, `upload_id`, `user_id`
- `authenticity_status`, `confidence_score`
- `detection_details`, `report_url`
- `is_flagged`, `flagged_by`, `flagged_reason`, `flagged_at`
- `created_at`

#### activity_logs
- `log_id`, `user_id`, `action`
- `timestamp`, `ip_address`, `details` (JSON)

#### support_tickets
- `ticket_id`, `user_id`, `subject`, `description`
- `category`, `status`, `priority`
- `assigned_to`, `resolution`, `resolved_at`
- `created_at`, `updated_at`

#### announcements
- `announcement_id`, `title`, `content`
- `status`, `created_by`
- `created_at`, `updated_at`

---

## 🔒 Security Considerations

### Authentication Security
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with expiration
- 2FA optional but recommended
- OAuth tokens verified with Firebase

### Data Protection
- File uploads stored securely
- User data encrypted at rest
- HTTPS required for production
- API endpoints protected with authentication middleware

### Admin Protection
- Admin routes protected with role-based middleware
- Admins cannot delete themselves
- Admins cannot remove own admin role
- Activity logging for all admin actions

---

## 🚀 Deployment Notes

### Environment Variables

#### Frontend (`.env`)
- `VITE_API_BASE_URL` - Backend API URL

#### Backend (`.env`)
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 5000)
- `DB_PATH` - SQLite database path
- `MPESA_CONSUMER_KEY` - MPESA API consumer key
- `MPESA_CONSUMER_SECRET` - MPESA API consumer secret
- `MPESA_SHORTCODE` - MPESA business shortcode
- `MPESA_PASSKEY` - MPESA API passkey
- `MPESA_CALLBACK_URL` - MPESA webhook callback URL
- `FIREBASE_API_KEY` - Firebase API key (for OAuth)

### Database Initialization
```bash
cd server
npm run init-db
```

This creates:
- Database tables
- Default plans (Free, Pro, Enterprise)
- Admin user (credentials in setup instructions)

---

## 📝 Future Enhancements

### Planned Features
1. **PDF Report Export**: Generate downloadable PDF verification reports
2. **Video Watermarking**: Extend watermarking to video files
3. **Batch Processing**: Process multiple images at once
4. **API Access**: RESTful API for enterprise integration
5. **White-Label Options**: Customizable branding for enterprise
6. **Advanced Analytics**: Detailed usage and performance analytics
7. **Webhook Support**: Real-time notifications for events
8. **Multi-language Support**: Internationalization

---

## 🎓 Getting Started

### For Users
1. **Sign Up**: Create account via email/password or OAuth
2. **Verify Email**: Check inbox for verification (optional)
3. **Enable 2FA**: Optional but recommended for security
4. **Choose Plan**: Select Free, Pro, or Enterprise plan
5. **Watermark Image**: Upload and embed watermark
6. **Verify Image**: Test watermark detection
7. **View History**: Check activity history
8. **Get Support**: Create ticket if needed

### For Admins
1. **Login**: Use admin credentials
2. **Dashboard**: View analytics and statistics
3. **Manage Users**: Search, update, or delete users
4. **Review Flags**: Check flagged verification reports
5. **Handle Tickets**: Manage support tickets
6. **Create Announcements**: Publish system announcements
7. **Monitor Security**: Review activity logs

---

## 📞 Support

### User Support
- **In-App Tickets**: Create support tickets from dashboard
- **Help Section**: FAQ and tutorials
- **Email Support**: Contact via support email (configured)

### Technical Support
- **Documentation**: This file and README.md
- **API Documentation**: See API endpoints section
- **Database Schema**: See database schema section

---

**StegaShield 1.5** - Protecting Digital Truth with Advanced Watermarking Technology

---

*Last Updated: 2024*

