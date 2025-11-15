-- StegaShield Database Schema

-- 1. Users Table
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

-- 2. Plans Table
CREATE TABLE IF NOT EXISTS plans (
    plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_name TEXT NOT NULL UNIQUE,
    price REAL NOT NULL,
    description TEXT,
    max_uploads_per_week INTEGER DEFAULT 10,
    features TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Payments Table
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

-- 4. Uploads Table
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

-- 5. Verification Reports Table
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

-- 6. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 7. Support Tickets Table
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

-- 8. Announcements Table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_upload ON verification_reports(upload_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON verification_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_flagged ON verification_reports(is_flagged);
CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at);

-- Insert default plans
INSERT OR IGNORE INTO plans (plan_id, plan_name, price, description, max_uploads_per_week, features) VALUES
(1, 'Free', 0.0, 'For casual users', 10, '["basic", "simple_verification"]'),
(2, 'Pro', 9.99, 'For content creators', 100, '["blind", "non-blind", "enhanced_detection", "unlimited_uploads"]'),
(3, 'Enterprise', 29.99, 'For organizations', -1, '["blind", "non-blind", "robust", "enhanced_detection", "unlimited_uploads", "priority_support", "api_access"]');

-- Note: Admin user is created by the init-db.js script with proper password hashing



