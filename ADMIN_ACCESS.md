# Admin Access Guide

## Default Admin Credentials

- **Email**: `admin@stegasheild.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password in production!

## How to Access Admin Dashboard

### Step 1: Login as Admin

1. Navigate to the login page: `http://localhost:5173/auth`
2. Enter the admin credentials:
   - Email: `admin@stegasheild.com`
   - Password: `admin123`
3. Click "Sign In →"

### Step 2: Navigate to Admin Section

Once logged in, you have several ways to access admin features:

#### Method 1: Direct URL
- Navigate to: `http://localhost:5173/dashboard/admin`
- This will show the Admin Analytics dashboard

#### Method 2: Via Sidebar
- Look for the **"Admin"** section in the sidebar (if you have admin role)
- Click on any admin menu item

#### Method 3: Admin Routes
- `/dashboard/admin` - Analytics Dashboard
- `/dashboard/admin/users` - User Management
- `/dashboard/admin/reports` - Flagged Reports
- `/dashboard/admin/plans` - Plan Management
- `/dashboard/admin/models` - AI Model Management
- `/dashboard/admin/announce` - Announcements
- `/dashboard/admin/security` - Security Logs

## Admin Features Available

1. **Analytics Dashboard** (`/dashboard/admin`)
   - System statistics
   - User counts
   - Payment summaries
   - Activity metrics

2. **User Management** (`/dashboard/admin/users`)
   - View all users
   - Edit user roles
   - Update user plans
   - Manage user accounts

3. **Flagged Reports** (`/dashboard/admin/reports`)
   - View flagged verification reports
   - Review suspicious activity

4. **Plan Management** (`/dashboard/admin/plans`)
   - View all subscription plans
   - Create new plans
   - Update existing plans
   - Set pricing

5. **Model Management** (`/dashboard/admin/models`)
   - View AI models
   - Update model versions
   - Test model performance
   - Switch active models

6. **Announcements** (`/dashboard/admin/announce`)
   - Create announcements
   - Manage announcements
   - Publish updates

7. **Security Logs** (`/dashboard/admin/security`)
   - View activity logs
   - Monitor security events
   - Track user actions

## Troubleshooting

### Can't Access Admin?
1. **Check your role**: Ensure you're logged in with the admin account
2. **Verify role**: Check the browser console - your role should be "admin"
3. **Database check**: Run `npm run init-db` in the server folder to ensure admin user exists
4. **Re-login**: Log out and log back in after changing roles

### Admin User Not Created?
Run the database initialization:
```bash
cd server
npm run init-db
```

This will create the admin user if it doesn't exist.

## Role Requirements

Admin routes require one of these roles:
- `admin`
- `developer`
- `moderator`

Only users with these roles can access `/dashboard/admin/*` routes.

