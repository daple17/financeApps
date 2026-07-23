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
  
  -- LCL / BB Specific fields
  weight DECIMAL(10,2) NULL,
  volume DECIMAL(10,2) NULL,
  quantity DECIMAL(10,2) NULL,
  unit VARCHAR(50) NULL,
  
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
