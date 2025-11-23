-- MySQL DDL for StegaShield database
-- Database name: Wowza

CREATE DATABASE IF NOT EXISTS `Wowza`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `Wowza`;

-- 1. Plans Table
CREATE TABLE IF NOT EXISTS `plans` (
  `plan_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `plan_name` VARCHAR(100) NOT NULL UNIQUE,
  `price` DECIMAL(10,2) NOT NULL,
  `description` TEXT,
  `max_uploads_per_week` INT DEFAULT 10,
  `features` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone_number` VARCHAR(50),
  `password_hash` VARCHAR(255),
  `role` ENUM('user','admin','developer','moderator') NOT NULL DEFAULT 'user',
  `plan_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_picture` TEXT,
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_secret` TEXT,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_users_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `plans`(`plan_id`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('MPESA','Card','PayPal','Stripe','Flutterwave') NOT NULL,
  `transaction_code` VARCHAR(255),
  `status` ENUM('Pending','Successful','Failed') NOT NULL DEFAULT 'Pending',
  `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `receipt_url` TEXT,
  PRIMARY KEY (`payment_id`),
  KEY `idx_payments_user` (`user_id`),
  KEY `idx_payments_status` (`status`),
  CONSTRAINT `fk_payments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_payments_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `plans`(`plan_id`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Uploads Table
CREATE TABLE IF NOT EXISTS `uploads` (
  `upload_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `file_name` VARCHAR(512) NOT NULL,
  `file_path` VARCHAR(1024) NOT NULL,
  `operation_type` ENUM('embed','verify') NOT NULL,
  `watermark_type` ENUM('blind','non-blind','robust','light','basic'),
  `metadata` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`upload_id`),
  KEY `idx_uploads_user` (`user_id`),
  KEY `idx_uploads_created` (`created_at`),
  CONSTRAINT `fk_uploads_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Verification Reports Table
CREATE TABLE IF NOT EXISTS `verification_reports` (
  `report_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `upload_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `authenticity_status` ENUM('Authentic','Tampered','Deepfake Suspected') NOT NULL,
  `confidence_score` DECIMAL(4,3) NOT NULL CHECK (`confidence_score` >= 0 AND `confidence_score` <= 1),
  `detection_details` TEXT,
  `report_url` TEXT,
  `is_flagged` TINYINT(1) NOT NULL DEFAULT 0,
  `flagged_by` INT UNSIGNED,
  `flagged_reason` TEXT,
  `flagged_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `idx_reports_upload` (`upload_id`),
  KEY `idx_reports_user` (`user_id`),
  KEY `idx_reports_flagged` (`is_flagged`),
  CONSTRAINT `fk_reports_upload`
    FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`upload_id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_reports_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_reports_flagged_by`
    FOREIGN KEY (`flagged_by`) REFERENCES `users`(`user_id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Activity Logs Table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `log_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED,
  `action` VARCHAR(255) NOT NULL,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(64),
  `details` TEXT,
  PRIMARY KEY (`log_id`),
  KEY `idx_logs_user` (`user_id`),
  KEY `idx_logs_timestamp` (`timestamp`),
  CONSTRAINT `fk_logs_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Support Tickets Table
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `ticket_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('Bug Report','Feature Request','Account Issue','Payment Issue','Other'),
  `status` ENUM('pending','in_progress','resolved','closed') NOT NULL DEFAULT 'pending',
  `priority` ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `assigned_to` INT UNSIGNED,
  `resolution` TEXT,
  `resolved_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ticket_id`),
  KEY `idx_tickets_user` (`user_id`),
  KEY `idx_tickets_status` (`status`),
  KEY `idx_tickets_assigned` (`assigned_to`),
  CONSTRAINT `fk_tickets_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_tickets_assigned`
    FOREIGN KEY (`assigned_to`) REFERENCES `users`(`user_id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Announcements Table
CREATE TABLE IF NOT EXISTS `announcements` (
  `announcement_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`announcement_id`),
  KEY `idx_announcements_status` (`status`),
  KEY `idx_announcements_created` (`created_at`),
  CONSTRAINT `fk_announcements_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default plans (similar to SQLite schema)
INSERT INTO `plans` (`plan_id`, `plan_name`, `price`, `description`, `max_uploads_per_week`, `features`) VALUES
  (1, 'Free', 0.00, 'For casual users', 10, '["basic", "simple_verification"]'),
  (2, 'Pro', 9.99, 'For content creators', 100, '["blind", "non-blind", "enhanced_detection", "unlimited_uploads"]'),
  (3, 'Enterprise', 29.99, 'For organizations', -1, '["blind", "non-blind", "robust", "enhanced_detection", "unlimited_uploads", "priority_support", "api_access"]')
ON DUPLICATE KEY UPDATE
  `plan_name` = VALUES(`plan_name`);

-- Note: Admin user creation and password hashing should be handled by an application-level script.


