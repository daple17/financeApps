-- Migration script 013_phase3_1_operations.sql

-- 1. Create Operations table
CREATE TABLE IF NOT EXISTS operations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_no VARCHAR(50) NOT NULL UNIQUE,
  job_order_id INT NOT NULL,
  operation_date DATE NOT NULL,
  planned_start DATETIME NULL,
  planned_completion DATETIME NULL,
  operational_pic_id INT NULL,
  priority VARCHAR(20) DEFAULT 'NORMAL',
  status VARCHAR(20) DEFAULT 'PLANNING',
  execution_quantity DECIMAL(15, 2) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NULL,
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (operational_pic_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Create Operation Events table (Audit Log)
CREATE TABLE IF NOT EXISTS operation_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  performed_by INT NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  notes TEXT NULL,
  FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Add RBAC permissions for Operations
INSERT IGNORE INTO roles (name, description, permissions) 
VALUES ('Operation Manager', 'Has full access to operations execution', '["operations.read", "operations.create", "operations.edit", "operations.status.change", "job_orders.read", "master_data.read"]');

-- Update Admin role (id=1 is usually admin) to ensure they have operations permissions
-- Assuming admin has permissions: ["*"] or we can just append if needed. Since admin has ["*"], it works automatically via hasPermission() logic.
