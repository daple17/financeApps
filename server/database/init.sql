-- Database Schema for Organization Financial Management System

-- Disable foreign key checks for table setup
SET FOREIGN_KEY_CHECKS = 0;

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
