-- Migration script 011_phase2_3_logistics_references.sql

-- 1. Vehicle Types
CREATE TABLE IF NOT EXISTS vehicle_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  capacity_weight_kg DECIMAL(15, 2) NULL,
  capacity_volume_cbm DECIMAL(15, 2) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Container Types
CREATE TABLE IF NOT EXISTS container_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  size_ft VARCHAR(20) NULL,
  category VARCHAR(50) NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Cargo Units
CREATE TABLE IF NOT EXISTS cargo_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Service Types
CREATE TABLE IF NOT EXISTS service_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Service Type - Job Type relational mapping
CREATE TABLE IF NOT EXISTS service_type_job_types (
  service_type_id INT NOT NULL,
  job_order_type VARCHAR(50) NOT NULL,
  PRIMARY KEY (service_type_id, job_order_type),
  FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE
);

-- Add Columns to Job Orders (allowing NULL to prevent breaking existing queries immediately)
ALTER TABLE job_orders ADD COLUMN service_type_id INT NULL AFTER service_type;
ALTER TABLE job_orders ADD COLUMN cargo_unit_id INT NULL AFTER cargo_unit;
ALTER TABLE job_orders ADD COLUMN vehicle_type_id INT NULL AFTER vehicle_type_requirement;

ALTER TABLE job_orders ADD CONSTRAINT fk_jo_service_type FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE SET NULL;
ALTER TABLE job_orders ADD CONSTRAINT fk_jo_cargo_unit FOREIGN KEY (cargo_unit_id) REFERENCES cargo_units(id) ON DELETE SET NULL;
ALTER TABLE job_orders ADD CONSTRAINT fk_jo_vehicle_type FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE SET NULL;

ALTER TABLE trucking_containers ADD COLUMN container_type_id INT NULL AFTER container_type;
ALTER TABLE trucking_containers ADD CONSTRAINT fk_tc_container_type FOREIGN KEY (container_type_id) REFERENCES container_types(id) ON DELETE SET NULL;

-- SEED DATA

INSERT IGNORE INTO vehicle_types (code, name) VALUES
('TRK-CDE', 'CDE'),
('TRK-CDD', 'CDD'),
('TRK-FUSO', 'Fuso'),
('TRK-TRAILER', 'Trailer'),
('TRK-WINGBOX', 'Wingbox');

INSERT IGNORE INTO container_types (code, name, size_ft, category) VALUES
('20GP', '20'' Standard', '20', 'General Purpose'),
('40GP', '40'' Standard', '40', 'General Purpose'),
('40HC', '40'' High Cube', '40', 'High Cube'),
('20RF', '20'' Reefer', '20', 'Reefer'),
('40RF', '40'' Reefer', '40', 'Reefer');

INSERT IGNORE INTO cargo_units (code, name) VALUES
('PCS', 'Pieces'),
('BOX', 'Box'),
('PALLET', 'Pallet'),
('CARTON', 'Carton'),
('BAG', 'Bag'),
('ROLL', 'Roll'),
('SET', 'Set'),
('UNIT', 'Unit');

INSERT IGNORE INTO service_types (code, name) VALUES
('CUSTOMS-CLEARANCE', 'Customs Clearance'),
('FREIGHT-FORWARDING', 'Freight Forwarding'),
('TRUCKING', 'Trucking'),
('WAREHOUSING', 'Warehousing'),
('DOOR-TO-DOOR', 'Door to Door'),
('PORT-TO-DOOR', 'Port to Door'),
('DOOR-TO-PORT', 'Door to Port'),
('PORT-TO-PORT', 'Port to Port');

-- Link Service Types to Job Types
-- 1 = Customs Clearance -> IMPORT, EXPORT
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'IMPORT' FROM service_types WHERE code = 'CUSTOMS-CLEARANCE';
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'EXPORT' FROM service_types WHERE code = 'CUSTOMS-CLEARANCE';
-- 2 = Freight Forwarding -> IMPORT, EXPORT
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'IMPORT' FROM service_types WHERE code = 'FREIGHT-FORWARDING';
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'EXPORT' FROM service_types WHERE code = 'FREIGHT-FORWARDING';
-- 3 = Trucking -> TRUCKING
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'TRUCKING' FROM service_types WHERE code = 'TRUCKING';
-- 4 = Warehousing -> IMPORT, EXPORT, PROJECT
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'IMPORT' FROM service_types WHERE code = 'WAREHOUSING';
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'EXPORT' FROM service_types WHERE code = 'WAREHOUSING';
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'PROJECT' FROM service_types WHERE code = 'WAREHOUSING';
-- 5 = Door to Door -> PROJECT, IMPORT, EXPORT
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'PROJECT' FROM service_types WHERE code = 'DOOR-TO-DOOR';
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'IMPORT' FROM service_types WHERE code = 'DOOR-TO-DOOR';
INSERT IGNORE INTO service_type_job_types (service_type_id, job_order_type) SELECT id, 'EXPORT' FROM service_types WHERE code = 'DOOR-TO-DOOR';

-- MIGRATION: Map old text values to the new Master Data 
-- For Cargo Units
UPDATE job_orders jo
JOIN cargo_units cu ON jo.cargo_unit = cu.name OR jo.cargo_unit = cu.code
SET jo.cargo_unit_id = cu.id
WHERE jo.cargo_unit IS NOT NULL AND jo.cargo_unit_id IS NULL;

-- For Vehicle Types
UPDATE job_orders jo
JOIN vehicle_types vt ON jo.vehicle_type_requirement = vt.name OR jo.vehicle_type_requirement = vt.code
SET jo.vehicle_type_id = vt.id
WHERE jo.vehicle_type_requirement IS NOT NULL AND jo.vehicle_type_id IS NULL;

-- For Service Types
UPDATE job_orders jo
JOIN service_types st ON jo.service_type = st.name OR jo.service_type = st.code
SET jo.service_type_id = st.id
WHERE jo.service_type IS NOT NULL AND jo.service_type_id IS NULL;

-- For Trucking Containers
UPDATE trucking_containers tc
JOIN container_types ct ON tc.container_type = ct.name OR tc.container_type = ct.code OR (
  tc.container_type = '20STD' AND ct.code = '20GP'
) OR (
  tc.container_type = '40STD' AND ct.code = '40GP'
)
SET tc.container_type_id = ct.id
WHERE tc.container_type IS NOT NULL AND tc.container_type_id IS NULL;
