# StegaShield

A comprehensive invisible watermarking and deepfake detection platform for digital media authenticity and trust. StegaShield provides robust, semi-fragile, and hybrid watermarking solutions to protect digital content and detect tampering.

## Project Overview

StegaShield is a full-stack web application that enables users to embed invisible watermarks into images and verify their authenticity. The system uses advanced watermarking algorithms to detect tampering, deepfakes, and unauthorized modifications.

**Watermark Types:**

- **Robust** - Survives compression, resizing, and format conversion. Best for ownership verification.
- **Semi-Fragile** - Detects subtle edits while tolerating minor processing. Ideal for tamper detection.
- **Hybrid** - Combines robust and semi-fragile layers for comprehensive protection.

**Key Features:**

- Multi-layer watermark embedding (DWT-SVD, LSB-based)
- Real-time tamper detection with bit accuracy metrics
- Platform-aware verification (accounts for WhatsApp, Instagram compression)
- User rating system for verification reports
- Support chat system for user assistance
- Comprehensive admin dashboard
- Attack playground for testing watermark robustness

**Performance:**

- Robust watermarks: High survival rate through compression and format conversion
- Semi-fragile watermarks: 70%+ accuracy threshold for authentic images
- Hybrid mode: Dual-layer verification with fragile hash validation

## Requirements

### Backend
- **Node.js** v18 or higher
- **npm** or **yarn**
- **SQLite3** (via better-sqlite3)

### Frontend
- **Node.js** v18 or higher
- **npm**

### Watermark Model Service
- **Python 3.10+** (required)
- **pip**, **setuptools**, **wheel**
- 4GB+ RAM recommended
- Optional: GPU support for faster processing

## Local Setup

### 1. Clone the repository

```bash
git clone (https://github.com/Manuella-R/StegaShield.git)
cd intagrated
```

### 2. Backend Setup

**Navigate to server directory:**

```bash
cd Stegasheild_1.5/server
```

**Install dependencies:**

```bash
npm install
```

**Create and configure environment file:**

```bash
cp .env.example .env
```

Edit `server/.env` and set:

```env
PORT=3001
JWT_SECRET=your-secret-key-here
DB_PATH=./database/stegasheild.db
UPLOAD_DIR=./uploads
MODEL_SERVICE_URL=http://localhost:8001
```

**Initialize the database:**

```bash
npm run init-db
```

This creates the SQLite database with all required tables and a default admin account:
- Email: `admin@stegasheild.com`
- Password: `admin123` **Change this in production!**

**Start the backend server:**

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The backend API will run on `http://localhost:3001`

### 3. Frontend Setup

**Navigate to project root:**

```bash
cd Stegasheild_1.5
```

**Install dependencies:**

```bash
npm install
```

**Create and configure environment file:**

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
VITE_API_URL=http://localhost:3001/api
```

**Start the development server:**

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Watermark Model Service Setup

The watermarking algorithms are exposed through a FastAPI microservice for scalability and independent deployment.

**Navigate to model directory:**

```bash
cd ../stegashield_model\ -\ Copy
```

**Create and activate virtual environment:**

**Create virtual environment:**

```bash
python3.10 -m venv .venv
```

**Note:** Ensure you have Python 3.10 or later installed. Check your version:

```bash
python3 --version
```

**Activate virtual environment:**

**macOS/Linux:**

```bash
source .venv/bin/activate
```

**Windows (Command Prompt):**

```cmd
.venv\Scripts\activate.bat
```

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

**Note:** You should see `(.venv)` in your terminal prompt when activated.

**Install dependencies:**

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

**Start the FastAPI model server:**

```bash
uvicorn api.app:app --host 0.0.0.0 --port 8001 --reload
```

The model service will run on `http://localhost:8001`

**Verify the service is running:**

```bash
curl http://localhost:8001/health
```

### 5. Verify Complete Setup

**All three services should be running:**

1. Backend API: `http://localhost:3001`
2. Frontend: `http://localhost:5173`
3. Model Service: `http://localhost:8001`

**Test the complete flow:**

1. Open `http://localhost:5173` in your browser
2. Register a new account or login with admin credentials
3. Navigate to "Embed Watermark" in the dashboard
4. Upload an image and select a watermark type
5. Download the watermarked image and metadata JSON
6. Navigate to "Verify Watermark"
7. Upload the watermarked image and metadata JSON
8. View the verification report

## Project Structure

```
intagrated/
├── Stegasheild_1.5/              # Main application
│   ├── server/                   # Backend API (Node.js/Express)
│   │   ├── database/            # Database schema and initialization
│   │   │   ├── schema.sql       # SQLite schema
│   │   │   └── db.js            # Database helper functions
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.js          # JWT authentication
│   │   │   └── upload.js       # File upload handling (Multer)
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth.js          # Authentication endpoints
│   │   │   ├── watermark.js     # Watermark embed/verify
│   │   │   ├── admin.js         # Admin endpoints
│   │   │   ├── payments.js     # Payment processing
│   │   │   └── chats.js         # Support chat system
│   │   ├── utils/               # Utility functions
│   │   │   ├── modelService.js  # FastAPI service client
│   │   │   ├── logger.js        # Logging utilities
│   │   │   └── email.js         # Email service
│   │   ├── uploads/             # User-uploaded files
│   │   ├── scripts/             # Database scripts
│   │   │   └── init-db.js       # Database initialization
│   │   └── server.js            # Main server entry point
│   │
│   ├── src/                      # Frontend React application
│   │   ├── components/          # Reusable React components
│   │   │   ├── Header.jsx      # Navigation header
│   │   │   ├── Footer.jsx       # Footer component
│   │   │   ├── Sidebar.jsx      # Dashboard sidebar
│   │   │   └── ProtectedRoute.jsx # Route protection
│   │   ├── pages/               # Page components
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── About.jsx        # About page
│   │   │   ├── AuthPages.jsx    # Login/Register
│   │   │   └── dashboard/       # Dashboard pages
│   │   │       ├── WatermarkUploader.jsx    # Embed watermarks
│   │   │       ├── VerificationUploader.jsx # Verify watermarks
│   │   │       ├── AttackPlayground.jsx      # Test attacks
│   │   │       ├── ActivityHistory.jsx       # User history
│   │   │       ├── SupportChat.jsx           # Support chat
│   │   │       └── Admin*.jsx                # Admin panels
│   │   ├── contexts/            # React contexts
│   │   │   ├── AuthContext.jsx  # Authentication state
│   │   │   └── ThemeContext.jsx # Theme management
│   │   ├── utils/               # Frontend utilities
│   │   │   └── api.js           # API client functions
│   │   ├── styles/              # Styling files
│   │   └── main.jsx             # React entry point
│   │
│   ├── public/                   # Static assets
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite configuration
│
└── stegashield_model - Copy/     # Python watermark model service
    ├── api/                      # FastAPI application
    │   └── app.py               # FastAPI endpoints (/embed, /verify)
    ├── models/                   # Watermarking algorithms
    │   ├── hybrid_multidomain_embed_det.py    # Robust embedder
    │   ├── hybrid_multidomain_verify_det.py   # Robust verifier
    │   └── semi_fragile_dwt_svd.py           # Semi-fragile DWT-SVD
    ├── training/                 # Training and testing utilities
    │   ├── test_harness_det.py   # Attack testing harness
    │   └── attacks.py           # Attack implementations
    ├── utils/                    # Utility functions
    │   └── visualization.py     # Heatmap generation
    ├── stegashield_profiles.py   # High-level API wrapper
    ├── requirements.txt          # Python dependencies
    └── README.md                 # Model documentation
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/forgot-password` - Request password reset

### Watermarking

- `POST /api/watermark/embed` - Embed watermark into image
  - Body: `multipart/form-data` with `file`, `watermark_type`, `metadata` (optional), `custom_id` (optional)
  - Returns: Watermarked image URL, metadata JSON URL, heatmap URL (for semi-fragile/hybrid)
  
- `POST /api/watermark/verify` - Verify watermark in image
  - Body: `multipart/form-data` with `file` (image), `metadata` (JSON file), `mode` (robust/semi_fragile/hybrid)
  - Returns: Verification report with status, score, metrics, explanations

- `GET /api/watermark/uploads` - Get user's upload history
- `GET /api/watermark/reports` - Get user's verification reports
- `GET /api/watermark/reports/:reportId` - Get specific report details
- `POST /api/watermark/reports/:reportId/rate` - Rate a verification report
- `GET /api/watermark/reports/ratings/average` - Get user's average rating

### Reports & Flagging

- `POST /api/watermark/reports/:reportId/flag` - Flag a report as incorrect
  - Body: `{ flag_category, extra_details }`
- `GET /api/watermark/reports/flag-history` - Get user's flag history

### Support Chat

- `POST /api/chats/create` - Create a new support chat
- `GET /api/chats/my-chats` - Get user's chat threads
- `GET /api/chats/:chatId` - Get chat details and messages
- `POST /api/chats/:chatId/messages` - Send a message in a chat

### Admin

- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId` - Update user
- `GET /api/admin/analytics` - Get system analytics
- `GET /api/admin/logs` - Get activity logs
- `GET /api/admin/reports/flagged` - Get flagged reports
- `PUT /api/admin/reports/:reportId/flag-status` - Update flag status
- `GET /api/admin/support/chats` - Get all support chats
- `POST /api/admin/support/chats/:chatId/messages` - Admin reply to chat

### Model Service (FastAPI)

- `POST /embed` - Embed watermark (called by Node backend)
- `POST /verify` - Verify watermark (called by Node backend)
- `GET /health` - Health check

## Watermark Types & Use Cases

### Robust Watermarks

**Best for:** Ownership verification, copyright protection

**Characteristics:**
- Survives JPEG compression, resizing, format conversion
- Uses LSB-based embedding in Y-channel
- Includes fragile hash for integrity checking
- Can embed user information (username/email)

**When to use:**
- Proving image ownership
- Copyright protection
- Content attribution
- Long-term archival

### Semi-Fragile Watermarks

**Best for:** Tamper detection, forensic analysis

**Characteristics:**
- Detects subtle edits and modifications
- Uses DWT-SVD algorithm with high redundancy (8x)
- Provides bit accuracy metrics
- Generates tamper heatmaps
- Threshold: 70%+ for authentic, 50-70% for tampered

**When to use:**
- Detecting image manipulation
- Forensic analysis
- Verifying image integrity
- Identifying deepfakes

### Hybrid Watermarks

**Best for:** Comprehensive protection

**Characteristics:**
- Combines robust and semi-fragile layers
- Dual verification for maximum security
- Fragile hash boost: +15% to semi-fragile score if hash matches
- Best of both worlds: ownership + tamper detection

**When to use:**
- Maximum security requirements
- Both ownership and tamper detection needed
- High-value content protection

## Environment Variables

### Backend (`server/.env`)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DB_PATH=./database/stegasheild.db

# File Uploads
UPLOAD_DIR=./uploads

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# Model Service
MODEL_SERVICE_URL=http://localhost:8001

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

### Model Service

The FastAPI service uses environment variables for configuration (optional):

```env
MODEL_SERVICE_HOST=0.0.0.0
MODEL_SERVICE_PORT=8001
MODEL_SERVICE_RELOAD=true
```

## Development

### Running in Development Mode

**Terminal 1 - Backend:**

```bash
cd Stegasheild_1.5/server
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd Stegasheild_1.5
npm run dev
```

**Terminal 3 - Model Service:**

```bash
cd stegashield_model\ -\ Copy
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn api.app:app --host 0.0.0.0 --port 8001 --reload
```

### Building for Production

**Build frontend:**

```bash
cd Stegasheild_1.5
npm run build
```

The built files will be in the `dist` directory. Serve with a static file server or integrate with the Express backend.

**Start production backend:**

```bash
cd server
npm start
```

**Start production model service:**

```bash
cd stegashield_model\ -\ Copy
source .venv/bin/activate
uvicorn api.app:app --host 0.0.0.0 --port 8001
```

## Database Schema

The application uses SQLite with the following main tables:

- **users** - User accounts, profiles, and authentication
- **plans** - Subscription plans and pricing tiers
- **payments** - Payment transactions and history
- **uploads** - Media file uploads and metadata
- **verification_reports** - Verification results and metrics
- **report_ratings** - User ratings for verification reports
- **report_flag_history** - Flagged reports and resolution tracking
- **support_chats** - Support chat threads
- **support_messages** - Individual chat messages
- **activity_logs** - System activity audit logs

See `server/database/schema.sql` for the complete schema definition.

## Troubleshooting

### Backend Issues

**Port already in use?**

```bash
# Change PORT in server/.env or kill the process using port 3001
lsof -ti:3001 | xargs kill -9  # macOS/Linux
```

**Database errors?**

```bash
cd server
npm run init-db  # Reinitialize database
```

**Model service connection failed?**

- Ensure the FastAPI service is running on port 8001
- Check `MODEL_SERVICE_URL` in `server/.env`
- Verify the service is accessible: `curl http://localhost:8001/health`

### Frontend Issues

**Build errors?**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API connection errors?**

- Verify `VITE_API_URL` in `.env`
- Ensure backend is running on the correct port
- Check CORS settings in `server/server.js`

### Model Service Issues

**Python version error?**

This project requires Python 3.10 or later:

```bash
python3 --version  # Should show 3.10.x or higher
```

If you have an older version, install Python 3.10+ from [python.org](https://www.python.org/downloads/) or use a version manager like `pyenv`.

**Virtual environment not active?**

**macOS/Linux:**

```bash
source .venv/bin/activate
```

**Windows (Command Prompt):**

```cmd
.venv\Scripts\activate.bat
```

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

**Missing dependencies?**

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

**Model service error: "Message too long"?**

- The image is too small for the default payload
- Use a shorter `custom_id` (10-15 characters) when embedding
- The UI will prompt you if this error occurs

**Verification error: "Metadata file and model do not match"?**

- Ensure you're using the correct metadata JSON file
- The metadata must match the selected watermark profile (robust/semi_fragile/hybrid)
- Download the metadata JSON during embedding and keep it with the watermarked image

### General Issues

**All services running but website not loading?**

1. Check browser console for errors (F12)
2. Verify all three services are running:
   - Backend: `http://localhost:3001`
   - Frontend: `http://localhost:5173`
   - Model Service: `http://localhost:8001`
3. Check network tab for failed API requests

**Watermark embedding fails?**

- Ensure model service is running
- Check image format (PNG, JPEG supported)
- Verify image size (minimum dimensions required for block-based algorithms)
- Check server logs for detailed error messages

**Verification shows incorrect results?**

- Ensure you're using the correct metadata JSON from embedding
- Check that the watermark profile matches (robust/semi_fragile/hybrid)
- Verify the image hasn't been heavily compressed or tampered with
- Check the verification report explanations for details

## Hardware Requirements

### Minimum
- **RAM:** 4GB
- **CPU:** Any modern processor
- **Storage:** 500MB for application + space for uploads

### Recommended
- **RAM:** 8GB+ for smoother operation
- **CPU:** Multi-core processor
- **Storage:** 2GB+ for uploads and database
- **GPU:** Optional, not required (CPU processing works fine)

### Development
- **RAM:** 8GB+ recommended
- **CPU:** Multi-core for faster compilation
- Tested on: Windows 10/11, macOS, Linux

## Security Considerations

**Important Security Notes:**

1. **Change default admin password** - The default admin account (`admin@stegasheild.com` / `admin123`) should be changed immediately in production.

2. **JWT Secret** - Use a strong, random JWT secret in production. Generate with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Database Security** - In production, consider:
   - Using PostgreSQL or MySQL instead of SQLite
   - Implementing database encryption
   - Regular backups

4. **File Upload Security** - Currently uses local storage. For production:
   - Implement cloud storage (AWS S3, Google Cloud Storage)
   - Add file size limits
   - Implement virus scanning
   - Validate file types strictly

5. **HTTPS** - Always use HTTPS in production. The application should be behind a reverse proxy (nginx, Apache) with SSL/TLS.

6. **Environment Variables** - Never commit `.env` files to version control. Use environment-specific configuration management.

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow code style** - Use ESLint for frontend, maintain consistent formatting
3. **Write meaningful comments** - Explain **why**, not **what**
4. **Test your changes** - Test watermark embedding and verification
5. **Update documentation** - Update README if adding features
6. **Submit a pull request** with a clear description

### Code Style

- **Frontend:** React functional components with hooks
- **Backend:** Express.js with async/await
- **Python:** PEP 8 style guide
- **Comments:** Explain business logic and complex algorithms

## License

Copyright © 2025 StegaShield. All rights reserved.

## Support

For support, please:
- Visit the Help & Education section in the dashboard
- Use the Support Chat feature
- Contact: support@stegasheild.com
- Location: Gigiri, Nairobi, Kenya
- Phone: +254 798 298573

## Acknowledgments

- The Lord Almighty for seeing this project through to the end
- My Mother and sister for their constant support
- My friends as well for their support
- My suoervisor, Mr. Tiberius
- All contributors and users of StegaShield

---

**Built for digital media authenticity and trust.**

