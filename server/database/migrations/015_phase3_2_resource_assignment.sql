-- Migration script 015_phase3_2_resource_assignment.sql

-- 1. Create Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_code VARCHAR(50) NOT NULL UNIQUE,
  driver_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(50) NULL,
  license_number VARCHAR(50) NULL,
  license_type VARCHAR(20) NULL,
  license_expiry_date DATE NULL,
  employment_type VARCHAR(50) DEFAULT 'INTERNAL', -- INTERNAL, EXTERNAL
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
  availability VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, ASSIGNED, ON_LEAVE
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Create Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_code VARCHAR(50) NOT NULL UNIQUE,
  plate_number VARCHAR(50) NOT NULL UNIQUE,
  vehicle_type_id INT NOT NULL,
  ownership_type VARCHAR(50) DEFAULT 'COMPANY_OWNED', -- COMPANY_OWNED, VENDOR, RENTAL
  vendor_id INT NULL,
  capacity_weight DECIMAL(15, 2) NULL,
  capacity_volume DECIMAL(15, 2) NULL,
  status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, ASSIGNED, MAINTENANCE, INACTIVE
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  updated_by INT NULL,
  FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (vendor_id) REFERENCES business_partners(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Create Operation Resource Assignments table
CREATE TABLE IF NOT EXISTS operation_resource_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_id INT NOT NULL,
  driver_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'ASSIGNED', -- ASSIGNED, RELEASED
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT NOT NULL,
  released_at TIMESTAMP NULL,
  released_by INT NULL,
  notes TEXT NULL,
  FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (released_by) REFERENCES users(id) ON DELETE SET NULL
);
