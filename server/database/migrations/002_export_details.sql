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
