-- ==========================================================
-- RESIDENTIAL SOCIETY MANAGEMENT SYSTEM (DBMS SCHEMA)
-- Follows Relational Model and 3NF Normalization Rules
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `residential_society_db`;
USE `residential_society_db`;

-- Drop tables in reverse order of foreign keys if re-initializing
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `maintenance_bills`;
DROP TABLE IF EXISTS `residents`;
DROP TABLE IF EXISTS `flats`;
DROP TABLE IF EXISTS `wings`;

-- 1. WINGS / BLOCKS TABLE
CREATE TABLE `wings` (
  `wing_id` INT AUTO_INCREMENT PRIMARY KEY,
  `wing_name` VARCHAR(10) NOT NULL UNIQUE,
  `total_floors` INT NOT NULL DEFAULT 5,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. FLATS TABLE (1:N with Wings)
CREATE TABLE `flats` (
  `flat_id` INT AUTO_INCREMENT PRIMARY KEY,
  `wing_id` INT NOT NULL,
  `flat_number` VARCHAR(10) NOT NULL,
  `floor_number` INT NOT NULL,
  `flat_type` ENUM('1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse') NOT NULL,
  `area_sqft` INT NOT NULL,
  `occupancy_status` ENUM('OCCUPIED', 'VACANT') DEFAULT 'OCCUPIED',
  CONSTRAINT `fk_flats_wing` FOREIGN KEY (`wing_id`) REFERENCES `wings` (`wing_id`) ON DELETE CASCADE,
  CONSTRAINT `uk_wing_flat` UNIQUE (`wing_id`, `flat_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. RESIDENTS TABLE (1:N with Flats)
CREATE TABLE `residents` (
  `resident_id` INT AUTO_INCREMENT PRIMARY KEY,
  `flat_id` INT NOT NULL,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `resident_type` ENUM('OWNER', 'TENANT') NOT NULL DEFAULT 'OWNER',
  `move_in_date` DATE NOT NULL,
  `emergency_contact` VARCHAR(20) DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_residents_flat` FOREIGN KEY (`flat_id`) REFERENCES `flats` (`flat_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. MAINTENANCE BILLS TABLE (1:N with Flats and Residents)
CREATE TABLE `maintenance_bills` (
  `bill_id` INT AUTO_INCREMENT PRIMARY KEY,
  `flat_id` INT NOT NULL,
  `resident_id` INT NOT NULL,
  `billing_month` VARCHAR(7) NOT NULL, -- e.g. '2026-10'
  `amount` DECIMAL(10, 2) NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('PAID', 'PENDING', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
  `payment_date` DATE DEFAULT NULL,
  `payment_method` ENUM('UPI', 'CREDIT_CARD', 'NET_BANKING', 'CASH', 'CHEQUE') DEFAULT NULL,
  `transaction_ref` VARCHAR(50) DEFAULT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bills_flat` FOREIGN KEY (`flat_id`) REFERENCES `flats` (`flat_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bills_resident` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`resident_id`) ON DELETE CASCADE,
  CONSTRAINT `uk_flat_billing_month` UNIQUE (`flat_id`, `billing_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. COMPLAINTS TABLE (Support Service Requests)
CREATE TABLE `complaints` (
  `complaint_id` INT AUTO_INCREMENT PRIMARY KEY,
  `flat_id` INT NOT NULL,
  `resident_id` INT NOT NULL,
  `category` ENUM('PLUMBING', 'ELECTRICAL', 'SECURITY', 'LIFT', 'PARKING', 'OTHER') NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'OPEN',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_complaints_flat` FOREIGN KEY (`flat_id`) REFERENCES `flats` (`flat_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_complaints_resident` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`resident_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Indexes for Optimized Query Performance
CREATE INDEX `idx_bills_status` ON `maintenance_bills` (`status`);
CREATE INDEX `idx_bills_month` ON `maintenance_bills` (`billing_month`);
CREATE INDEX `idx_residents_type` ON `residents` (`resident_type`);
