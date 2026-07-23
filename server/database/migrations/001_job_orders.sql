-- Additive migration for Phase 1: Job Order Module
-- This script does not drop existing tables.

-- 1. Job Orders Table
CREATE TABLE IF NOT EXISTS job_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_order_number VARCHAR(50) NOT NULL UNIQUE,
  job_date DATE NOT NULL,
  
  -- Customer Information (Denormalized for Phase 1)
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
  FOREIGN KEY (updated_by) REFERENCES users(id)
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
