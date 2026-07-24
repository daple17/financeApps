-- Additive migration for Phase 2.2: Location Master Data
-- This script adds countries, ports, and warehouses tables.

-- 1. Countries
CREATE TABLE IF NOT EXISTS countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_code VARCHAR(10) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  iso2 VARCHAR(2) NULL,
  iso3 VARCHAR(3) NULL,
  phone_code VARCHAR(10) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 2. Ports
CREATE TABLE IF NOT EXISTS ports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  port_code VARCHAR(50) NOT NULL UNIQUE,
  port_name VARCHAR(255) NOT NULL,
  port_type VARCHAR(50) NOT NULL, -- SEA_PORT, AIRPORT, INLAND_PORT, OTHER
  trade_scope VARCHAR(50) NOT NULL, -- INTERNATIONAL, DOMESTIC, BOTH
  country_id INT NOT NULL,
  city VARCHAR(100) NULL,
  un_locode VARCHAR(50) NULL,
  address TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 3. Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_code VARCHAR(50) NOT NULL UNIQUE,
  warehouse_name VARCHAR(255) NOT NULL,
  warehouse_type VARCHAR(50) NOT NULL, -- OWN, CUSTOMER, VENDOR, PUBLIC, BONDED, OTHER
  country_id INT NOT NULL,
  city VARCHAR(100) NULL,
  address TEXT NULL,
  contact_person VARCHAR(100) NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(100) NULL,
  business_partner_id INT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE RESTRICT,
  FOREIGN KEY (business_partner_id) REFERENCES business_partners(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
