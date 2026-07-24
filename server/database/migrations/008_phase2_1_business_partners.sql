-- Migration for Phase 2.1: Master Data Foundation & Business Partner

-- 1. Business Partners Table
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

-- 2. Business Partner Roles Table
CREATE TABLE IF NOT EXISTS business_partner_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  role ENUM('CUSTOMER', 'VENDOR', 'SHIPPER', 'SHIPPING_AGENT', 'SHIPPING_COMPANY') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE CASCADE,
  UNIQUE KEY unique_partner_role (partner_id, role)
);

-- 3. Business Partner Contacts Table (PIC)
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

-- 4. Alter job_orders table to include Master Data References
ALTER TABLE job_orders ADD COLUMN customer_id INT NULL AFTER job_date;
ALTER TABLE job_orders ADD COLUMN customer_contact_id INT NULL AFTER customer_id;

ALTER TABLE job_orders ADD CONSTRAINT fk_job_orders_customer FOREIGN KEY (customer_id) REFERENCES business_partners(id) ON DELETE RESTRICT;
ALTER TABLE job_orders ADD CONSTRAINT fk_job_orders_customer_contact FOREIGN KEY (customer_contact_id) REFERENCES business_partner_contacts(id) ON DELETE SET NULL;
