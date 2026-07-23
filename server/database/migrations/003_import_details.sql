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
