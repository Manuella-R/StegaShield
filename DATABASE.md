## Database Overview

StegaShield uses a single SQLite database (`stegasheild.db`) managed via `better-sqlite3`.  
All schema is defined in `server/database/schema.sql` and initialized by `server/database/db.js`.

The database is **relational and normalized**, centered around the `users` table and its relationships to plans, payments, uploads, verification reports, support tickets, announcements, and activity logs.

---

## Entity-Relationship Model (High Level)

- **users**
  - 1 ↔ N **payments**
  - 1 ↔ N **uploads**
  - 1 ↔ N **verification_reports**
  - 1 ↔ N **activity_logs**
  - 1 ↔ N **support_tickets** (as ticket owner)
  - 1 ↔ N **support_tickets** (as assigned admin)
  - 1 ↔ N **announcements** (as creator)
  - N ↔ 1 **plans**

- **plans**
  - 1 ↔ N **users**
  - 1 ↔ N **payments**

- **uploads**
  - N ↔ 1 **users**
  - 1 ↔ N **verification_reports**

- **verification_reports**
  - N ↔ 1 **uploads**
  - N ↔ 1 **users** (owner of the verification)
  - N ↔ 1 **users** (flagged_by – the user who flagged the report)

- **support_tickets**
  - N ↔ 1 **users** (ticket owner)
  - N ↔ 1 **users** (assigned_to – admin handling the ticket)

- **announcements**
  - N ↔ 1 **users** (created_by – admin who published the announcement)

---

## Tables and Schemas

### 1. `users`

**Purpose**: Core identity table for all accounts (regular users, admins, developers, moderators).

```sql
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password_hash TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'developer', 'moderator')),
    plan_id INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    profile_picture TEXT,
    email_verified INTEGER DEFAULT 0,
    two_factor_enabled INTEGER DEFAULT 0,
    two_factor_secret TEXT,
    FOREIGN KEY (plan_id) REFERENCES plans(plan_id)
);
```

- **Primary Key**: `user_id`
- **Important Columns**:
  - `role`: controls access (user/admin/developer/moderator).
  - `plan_id`: current subscription plan.
  - `two_factor_enabled` / `two_factor_secret`: controls 2FA.
  - `password_hash`: may be `NULL` for pure OAuth users.
- **Indexes**:
  - `idx_users_email` on `email`
  - `idx_users_plan` on `plan_id`

**Relationships**:
- Each user **belongs to** one `plan`.
- Each user **can have many** payments, uploads, verification reports, activity logs, support tickets, and announcements.

---

### 2. `plans`

**Purpose**: Subscription tiers (Free, Pro, Enterprise).

```sql
CREATE TABLE IF NOT EXISTS plans (
    plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_name TEXT NOT NULL UNIQUE,
    price REAL NOT NULL,
    description TEXT,
    max_uploads_per_week INTEGER DEFAULT 10,
    features TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- **Primary Key**: `plan_id`
- **Important Columns**:
  - `plan_name`: e.g. "Free", "Pro", "Enterprise".
  - `max_uploads_per_week`: `-1` indicates no limit.
  - `features`: JSON string of feature flags.

**Relationships**:
- One plan **can be assigned to many** users.
- One plan **can appear in many** payments.

**Seed Data**:
- `Free`, `Pro`, and `Enterprise` are inserted if missing.

---

### 3. `payments`

**Purpose**: Record all subscription-related payments (MPESA, Card, etc.).

```sql
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('MPESA', 'Card', 'PayPal', 'Stripe', 'Flutterwave')),
    transaction_code TEXT,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Successful', 'Failed')),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    receipt_url TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (plan_id) REFERENCES plans(plan_id)
);
```

- **Primary Key**: `payment_id`
- **Foreign Keys**:
  - `user_id` → `users.user_id`
  - `plan_id` → `plans.plan_id`
- **Indexes**:
  - `idx_payments_user` on `user_id`
  - `idx_payments_status` on `status`

**Typical Usage**:
- When a user upgrades/downgrades a plan, a row is created linking user, plan, and payment details.

---

### 4. `uploads`

**Purpose**: Store every file-based operation (watermark embed or verification request).

```sql
CREATE TABLE IF NOT EXISTS uploads (
    upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK(operation_type IN ('embed', 'verify')),
    watermark_type TEXT CHECK(watermark_type IN ('blind', 'non-blind', 'robust', 'light', 'basic')),
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

- **Primary Key**: `upload_id`
- **Foreign Keys**:
  - `user_id` → `users.user_id`
- **Indexes**:
  - `idx_uploads_user` on `user_id`
  - `idx_uploads_created` on `created_at`

**Relationships**:
- One upload **can have many** `verification_reports`.

**Typical Usage**:
- An embed or verify operation creates an `uploads` record, later linked to verification reports.

---

### 5. `verification_reports`

**Purpose**: Store the results of verification operations, including authenticity decisions and flagging info.

```sql
CREATE TABLE IF NOT EXISTS verification_reports (
    report_id INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    authenticity_status TEXT NOT NULL CHECK(authenticity_status IN ('Authentic', 'Tampered', 'Deepfake Suspected')),
    confidence_score REAL NOT NULL CHECK(confidence_score >= 0 AND confidence_score <= 1),
    detection_details TEXT,
    report_url TEXT,
    is_flagged INTEGER DEFAULT 0 CHECK(is_flagged IN (0, 1)),
    flagged_by INTEGER,
    flagged_reason TEXT,
    flagged_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_id) REFERENCES uploads(upload_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (flagged_by) REFERENCES users(user_id)
);
```

- **Primary Key**: `report_id`
- **Foreign Keys**:
  - `upload_id` → `uploads.upload_id` (the upload this report is derived from)
  - `user_id` → `users.user_id` (owner of the verification)
  - `flagged_by` → `users.user_id` (user who flagged the report, if any)
- **Indexes**:
  - `idx_reports_upload` on `upload_id`
  - `idx_reports_user` on `user_id`
  - `idx_reports_flagged` on `is_flagged`

**Typical Usage**:
- Verification endpoint creates a report linked to the `uploads` row and `users` row.
- Users can flag a report; admins fetch flagged reports via this table.

---

### 6. `activity_logs`

**Purpose**: General audit and security logging.

```sql
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

- **Primary Key**: `log_id`
- **Foreign Keys**:
  - `user_id` → `users.user_id` (nullable for anonymous/system actions)
- **Indexes**:
  - `idx_logs_user` on `user_id`
  - `idx_logs_timestamp` on `timestamp`

**Typical Usage**:
- Log important user actions such as login, payment, embed/verify operations, admin changes, etc.

---

### 7. `support_tickets`

**Purpose**: User support tickets and admin handling workflow.

```sql
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK(category IN ('Bug Report', 'Feature Request', 'Account Issue', 'Payment Issue', 'Other')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to INTEGER,
    resolution TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);
```

- **Primary Key**: `ticket_id`
- **Foreign Keys**:
  - `user_id` → `users.user_id` (ticket owner)
  - `assigned_to` → `users.user_id` (admin/mod handling the ticket)
- **Indexes**:
  - `idx_tickets_user` on `user_id`
  - `idx_tickets_status` on `status`
  - `idx_tickets_assigned` on `assigned_to`

**Typical Usage**:
- Users create tickets linked to their `user_id`.
- Admin dashboard assigns and updates tickets using `assigned_to`, `status`, and `resolution`.

---

### 8. `announcements`

**Purpose**: System-wide announcements created by admins.

```sql
CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

- **Primary Key**: `announcement_id`
- **Foreign Keys**:
  - `created_by` → `users.user_id` (creator/admin)
- **Indexes**:
  - `idx_announcements_status` on `status`
  - `idx_announcements_created` on `created_at`

**Typical Usage**:
- Admin creates announcements referencing their user ID.
- Frontend fetches `published` announcements for all users.

---

## How the Backend Uses the Database

The `dbHelpers` object in `server/database/db.js` encapsulates all database access:

- **Users & Auth**:
  - `getUserByEmail`, `getUserById`, `createUser`, `updateUser`
- **Plans & Payments**:
  - `getAllPlans`, `getPlanById`
  - `createPayment`, `getPaymentsByUser`, `getAllPayments`, `updatePayment`
- **Uploads & Reports**:
  - `createUpload`, `getUploadsByUser`, `getAllUploads`, `getUploadById`, `updateUpload`
  - `createReport`, `getReportsByUser`, `getReportById`, `getAllReports`, `getFlaggedReports`, `flagReport`, `unflagReport`, `updateReport`
- **Activity Logs & Analytics**:
  - `createLog`, `getLogsByUser`, `getAllLogs`
  - `getUploadStats`, `getUserCount`, `getTotalUploads`, `getRevenueStats`
- **Support Tickets**:
  - `createTicket`, `getTicketsByUser`, `getAllTickets`, `getTicketById`, `updateTicket`, `deleteTicket`
- **User Management**:
  - `searchUsers`, `deleteUser`, `getAllUsers`
- **Announcements**:
  - `createAnnouncement`, `getAllAnnouncements`, `getPublishedAnnouncements`, `getAnnouncementById`, `updateAnnouncement`, `deleteAnnouncement`

These helpers are used by the Express route handlers to ensure all database access is centralized, making it easier to maintain schema changes and reason about relationships.

---

## Conceptual Flow Examples

- **Watermark Embed → Verify → Report**:
  1. User uploads image → row in `uploads` (`operation_type = 'embed'`).
  2. Later, user verifies an image → new row in `uploads` (`operation_type = 'verify'`).
  3. Verification logic generates result → row in `verification_reports` linked to the verify `upload_id` and `user_id`.
  4. If user flags the report → `is_flagged = 1`, `flagged_by` and `flagged_reason` set.

- **Subscription Upgrade with MPESA**:
  1. User chooses plan → backend calls `createPayment` (row in `payments`).
  2. MPESA callback updates payment `status` via `updatePayment`.
  3. On successful payment, `users.plan_id` is updated and reflected across the app.

This document should give you enough detail to understand how tables relate and how data flows through the system.


