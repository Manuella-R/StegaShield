# StegaShield Setup Guide

## Quick Start

### 1. Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` and set:
```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
```

5. Initialize the database:
```bash
npm run init-db
```

6. Start the server:
```bash
npm start
```

The backend API will run on `http://localhost:3001`

### 2. Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Edit `.env` and set:
```env
VITE_API_URL=http://localhost:3001/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Admin Account

- Email: `admin@stegasheild.com`
- Password: `admin123`

⚠️ **Change this password in production!**

## Database

The database is automatically initialized when you run the server. The database file will be created at `server/database/stegasheild.db`.

## Testing

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

4. Register a new account or log in with the admin account (admin@stegasheild.com / admin123)

## Production Deployment

### Backend

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper database backup
4. Set up SSL/TLS
5. Configure proper file storage (e.g., AWS S3)
6. Set up proper logging and monitoring

### Frontend

1. Build the frontend:
```bash
npm run build
```

2. Serve the `dist` directory using a web server (e.g., Nginx, Apache)

## Troubleshooting

### Database Issues

If you encounter database issues, delete the database file and reinitialize:
```bash
rm server/database/stegasheild.db
cd server
npm run init-db
```

### Port Conflicts

If port 3001 is already in use, change the `PORT` in `server/.env`

If port 5173 is already in use, Vite will automatically use the next available port

### API Connection Issues

Make sure the backend server is running and the `VITE_API_URL` in the frontend `.env` matches the backend URL

## Support

For support, please contact [support@stegasheild.com](mailto:support@stegasheild.com) or visit the Help & Education section in the dashboard.






