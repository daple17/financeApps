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
