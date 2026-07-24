-- Database Schema for Organization Financial Management System

-- Disable foreign key checks for table setup
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS job_order_activities;
DROP TABLE IF EXISTS export_details;
DROP TABLE IF EXISTS import_details;
DROP TABLE IF EXISTS trucking_details;
DROP TABLE IF EXISTS trucking_containers;
DROP TABLE IF EXISTS project_details;

DROP TABLE IF EXISTS job_orders;
DROP TABLE IF EXISTS business_partner_contacts;
DROP TABLE IF EXISTS business_partner_roles;
DROP TABLE IF EXISTS business_partners;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Roles Table (RBAC)
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  permissions JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  nip VARCHAR(50) NULL,
  phone_number VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- 2.5 Business Partners
CREATE TABLE IF NOT EXISTS business_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_code VARCHAR(50) NOT NULL UNIQUE,
  partner_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100) NULL,
  partner_type ENUM('COMPANY', 'INDIVIDUAL') NOT NULL DEFAULT 'COMPANY',
  email VARCHAR(120) NULL,
  phone VARCHAR(50) NULL,
  city VARCHAR(100) NULL,
  address TEXT NULL,
  npwp VARCHAR(50) NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2.6 Business Partner Roles
CREATE TABLE IF NOT EXISTS business_partner_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  role ENUM('CUSTOMER', 'VENDOR', 'SHIPPER', 'SHIPPING_AGENT', 'SHIPPING_COMPANY') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE CASCADE,
  UNIQUE KEY unique_partner_role (partner_id, role)
);

-- 2.7 Business Partner Contacts
CREATE TABLE IF NOT EXISTS business_partner_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100) NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(120) NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE CASCADE
);

-- 3. Chart of Accounts (COA) Table
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
  category VARCHAR(50) NOT NULL,
  parent_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- 4. Transactions Table (Income, Expense, Transfer, Direct Journal)
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_number VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  type ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'JOURNAL') NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
  attachment_url VARCHAR(255) NULL,
  created_by INT NOT NULL,
  approved_by INT NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 5. Journal Entries Table (Double-Entry Bookkeeping)
CREATE TABLE journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  account_id INT NOT NULL,
  entry_type ENUM('DEBIT', 'CREDIT') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- 6. Budgets Table
CREATE TABLE budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  used_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_budget_period (account_id, period_month, period_year),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 7. Audit Logs Table
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- INITIAL SEED DATA
-- Default Roles
INSERT INTO roles (id, name, description, permissions) VALUES
(1, 'Super Admin', 'Akses penuh ke seluruh modul sistem & user management', '["*"]'),
(2, 'Finance Admin', 'Kelola transaksi, COA, jurnal, dan laporan keuangan', '["coa.*", "transactions.*", "reports.*", "budgets.*"]'),
(3, 'Approver', 'Manajer / Pengawas yang berwenang menyetujui pengajuan transaksi', '["approvals.*", "reports.read"]'),
(4, 'Auditor / Staff', 'View-only laporan keuangan dan pencatatan draft pengajuan', '["transactions.create", "transactions.read", "reports.read"]');

-- Default Seed Users (Password default: Admin@123456 -> bcrypt hash)
INSERT INTO users (id, username, name, email, password_hash, role_id, is_active) VALUES
(1, 'superadmin', 'System Administrator', 'admin@orgfinance.com', '$2a$10$zkNr6oleytt3F.WqrSrUBuPs5gu7LT3ZTxdnfDA27/9mI6HVClOk.', 1, TRUE),
(2, 'financeadmin', 'Finance Officer', 'finance@orgfinance.com', '$2a$10$zkNr6oleytt3F.WqrSrUBuPs5gu7LT3ZTxdnfDA27/9mI6HVClOk.', 2, TRUE),
(3, 'manager', 'Finance Manager', 'manager@orgfinance.com', '$2a$10$zkNr6oleytt3F.WqrSrUBuPs5gu7LT3ZTxdnfDA27/9mI6HVClOk.', 3, TRUE);

-- Default Chart of Accounts (COA)
INSERT INTO accounts (id, code, name, type, category, parent_id) VALUES
-- ASSETS
(1000, '1000', 'Aset Lancar', 'ASSET', 'Lancar', NULL),
(1001, '1100', 'Kas Utama Organisasi', 'ASSET', 'Lancar', 1000),
(1002, '1200', 'Bank BCA Organisasi', 'ASSET', 'Lancar', 1000),
(1003, '1300', 'Piutang Operasional', 'ASSET', 'Lancar', 1000),
(1500, '1500', 'Aset Tetap', 'ASSET', 'Tetap', NULL),
(1501, '1510', 'Peralatan & Inventaris Kantor', 'ASSET', 'Tetap', 1500),
-- LIABILITIES
(2000, '2000', 'Kewajiban Jangka Pendek', 'LIABILITY', 'Jangka Pendek', NULL),
(2001, '2100', 'Hutang Usaha / Vendor', 'LIABILITY', 'Jangka Pendek', 2000),
(2002, '2200', 'Hutang Gaji & Operasional', 'LIABILITY', 'Jangka Pendek', 2000),
-- EQUITY
(3000, '3000', 'Ekuitas Organisasi', 'EQUITY', 'Modal', NULL),
(3001, '3100', 'Modal Awal Kas Organisasi', 'EQUITY', 'Modal', 3000),
(3002, '3200', 'Laba Ditahan', 'EQUITY', 'Modal', 3000),
-- REVENUE
(4000, '4000', 'Pendapatan Operasional', 'REVENUE', 'Pendapatan Utama', NULL),
(4001, '4100', 'Iuran & Contribusi Anggota', 'REVENUE', 'Pendapatan Utama', 4000),
(4002, '4200', 'Pendapatan Event / Project', 'REVENUE', 'Pendapatan Utama', 4000),
(4003, '4300', 'Donasi & Hibah Organisasi', 'REVENUE', 'Pendapatan Lain', 4000),
-- EXPENSES
(5000, '5000', 'Beban Operasional', 'EXPENSE', 'Operasional', NULL),
(5001, '5100', 'Beban Gaji & Honorarium', 'EXPENSE', 'Operasional', 5000),
(5002, '5200', 'Beban Sewa Kantor / Tempat', 'EXPENSE', 'Operasional', 5000),
(5003, '5300', 'Beban Listrik, Air & Internet', 'EXPENSE', 'Operasional', 5000),
(5004, '5400', 'Beban Perlengkapan ATK & Konsumsi', 'EXPENSE', 'Operasional', 5000),
(5005, '5500', 'Beban Transportasi & Perjalanan Dinas', 'EXPENSE', 'Operasional', 5000);
-- Additive migration for Phase 1: Job Order Module
-- This script does not drop existing tables.

-- 1. Job Orders Table
CREATE TABLE IF NOT EXISTS job_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_order_number VARCHAR(50) NOT NULL UNIQUE,
  job_date DATE NOT NULL,
  
  -- Customer Information (Denormalized for Phase 1, Master Data for Phase 2)
  customer_id INT NULL,
  customer_contact_id INT NULL,
  customer_name VARCHAR(255) NULL,
  customer_reference VARCHAR(100) NULL,
  customer_pic VARCHAR(100) NULL,
  customer_phone VARCHAR(50) NULL,
  
  -- Service
  service_type VARCHAR(50) NULL,
  
  -- Pickup Information
  pickup_location VARCHAR(255) NULL,
  pickup_address TEXT NULL,
  pickup_date DATETIME NULL,
  
  -- Delivery Information
  delivery_location VARCHAR(255) NULL,
  delivery_address TEXT NULL,
  delivery_target_date DATETIME NULL,
  
  -- Cargo Information
  cargo_type VARCHAR(100) NULL,
  cargo_description TEXT NULL,
  cargo_quantity DECIMAL(15, 2) NULL,
  cargo_unit VARCHAR(50) NULL,
  cargo_weight DECIMAL(15, 2) NULL,
  cargo_volume DECIMAL(15, 2) NULL,
  
  -- Transport Requirement
  vehicle_type_requirement VARCHAR(100) NULL,
  vehicle_quantity INT NULL,
  
  -- Additional Information
  special_instruction TEXT NULL,
  internal_notes TEXT NULL,
  
  -- Status
  job_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  
  -- Audit
  created_by INT NOT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES business_partners(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_contact_id) REFERENCES business_partner_contacts(id) ON DELETE SET NULL
);

-- 2. Job Order Activities Table
CREATE TABLE IF NOT EXISTS job_order_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_order_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  performed_by INT NULL,
  source VARCHAR(50) DEFAULT 'WEB',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);
-- Additive migration for Phase 1.1: Job Order Types & Dynamic Form
-- This script adds the job_order_type column and export detail table.

-- 1. Add job_order_type to job_orders if it doesn't exist
-- Note: MySQL doesn't have "ADD COLUMN IF NOT EXISTS" easily in one line without procedures for older versions, 
-- but assuming this runs once. 
ALTER TABLE job_orders ADD COLUMN job_order_type VARCHAR(50) NULL AFTER job_date;

-- 2. Job Order Export Details Table
CREATE TABLE IF NOT EXISTS export_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_order_id INT NOT NULL UNIQUE,
  
  -- Export Document
  aju_number VARCHAR(100) NULL,
  invoice_number VARCHAR(100) NULL,
  shipper VARCHAR(255) NULL,
  
  -- Shipping Document
  bl_number VARCHAR(100) NULL,
  bl_date DATE NULL,
  hbl_number VARCHAR(100) NULL,
  hbl_date DATE NULL,
  si_do_number VARCHAR(100) NULL,
  si_do_date DATE NULL,
  
  -- Shipping Information
  eta_date DATE NULL,
  planned_delivery_date DATE NULL,
  vessel VARCHAR(255) NULL,
  warehouse VARCHAR(255) NULL,
  
  -- Cargo / Container
  party_volume_type VARCHAR(50) NULL, -- 'FCL' or 'LCL/BB'
  
  -- FCL specific container quantity
  container_20_qty INT NULL DEFAULT 0,
  container_40_qty INT NULL DEFAULT 0,
  container_45_qty INT NULL DEFAULT 0,
  container_ot_qty INT NULL DEFAULT 0,
  container_fr_qty INT NULL DEFAULT 0,
  
  -- General volume/qty for Export
  tonnage DECIMAL(15, 2) NULL,
  volume_m3 DECIMAL(15, 2) NULL,
  quantity DECIMAL(15, 2) NULL,
  unit VARCHAR(50) NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
);
-- Additive migration for Phase 1.2: Import Job Order Detail & Export Enhancements
-- 1. Add customs_document_type, customs_document_other, and etd_date to job_order_export_details
ALTER TABLE export_details 
  ADD COLUMN customs_document_type VARCHAR(50) NULL AFTER job_order_id,
  ADD COLUMN customs_document_other VARCHAR(255) NULL AFTER customs_document_type,
  ADD COLUMN etd_date DATE NULL AFTER eta_date;

-- 2. Migrate existing eta_date data to etd_date for EXPORT jobs
UPDATE export_details SET etd_date = eta_date WHERE eta_date IS NOT NULL;

-- 3. Job Order Import Details Table
CREATE TABLE IF NOT EXISTS import_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_order_id INT NOT NULL UNIQUE,
  
  -- Import Document
  customs_document_type VARCHAR(50) NULL,
  customs_document_other VARCHAR(255) NULL,
  aju_number VARCHAR(100) NULL,
  invoice_number VARCHAR(100) NULL,
  shipper VARCHAR(255) NULL,
  
  -- Shipping Document
  bl_number VARCHAR(100) NULL,
  bl_date DATE NULL,
  hbl_number VARCHAR(100) NULL,
  hbl_date DATE NULL,
  do_number VARCHAR(100) NULL,
  do_date DATE NULL,
  
  -- Shipping Information
  eta_date DATE NULL,
  planned_delivery_date DATE NULL,
  vessel VARCHAR(255) NULL,
  warehouse VARCHAR(255) NULL,
  
  -- Cargo / Container
  party_volume_type VARCHAR(50) NULL, -- 'FCL' or 'LCL/BB'
  
  -- FCL specific container quantity
  container_20_qty INT NULL DEFAULT 0,
  container_40_qty INT NULL DEFAULT 0,
  container_45_qty INT NULL DEFAULT 0,
  container_ot_qty INT NULL DEFAULT 0,
  container_fr_qty INT NULL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
);
-- Migration for Phase 1.3: Job Order Type TRUCKING

-- 1. Trucking Details Table
CREATE TABLE IF NOT EXISTS trucking_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_order_id INT NOT NULL UNIQUE,
  
  -- Shipping Reference
  bl_number VARCHAR(100) NULL,
  bl_date DATE NULL,
  si_do_number VARCHAR(100) NULL,
  si_do_date DATE NULL,
  
  -- Shipping Information
  vessel VARCHAR(255) NULL,
  planned_delivery_date DATE NULL,
  
  -- Cargo / Container
  party_volume_type VARCHAR(50) NULL, -- 'FCL' or 'LCL/BB'
  
  -- LCL / BB Specific fields (Migrated to Job Orders Cargo)
  -- Note: Weight, volume, quantity, and unit are now managed in the job_orders table 
  -- under cargo_weight, cargo_volume, cargo_quantity, and cargo_unit.
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
);

-- 2. Trucking Containers Table
CREATE TABLE IF NOT EXISTS trucking_containers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_order_id INT NOT NULL,
  container_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
);
-- Additive migration for Phase 1.4: Job Order Type Project

CREATE TABLE IF NOT EXISTS project_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_order_id INT NOT NULL UNIQUE,
  
  -- Project Reference
  si_do_number VARCHAR(100) NULL,
  si_do_date DATE NULL,
  planned_delivery_date DATE NULL,
  
  -- Project Information
  project_name VARCHAR(255) NULL,
  project_site VARCHAR(255) NULL,
  site_pic_name VARCHAR(100) NULL,
  site_pic_phone VARCHAR(50) NULL,
  
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
);
