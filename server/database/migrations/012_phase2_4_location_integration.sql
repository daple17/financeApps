-- Migration script 012_phase2_4_location_integration.sql

-- Add Location Integration columns to Job Orders (allowing NULL to prevent breaking existing queries immediately)
ALTER TABLE job_orders ADD COLUMN pickup_location_type VARCHAR(20) NULL AFTER service_type_id;
ALTER TABLE job_orders ADD COLUMN pickup_reference_id INT NULL AFTER pickup_location_type;

ALTER TABLE job_orders ADD COLUMN delivery_location_type VARCHAR(20) NULL AFTER pickup_date;
ALTER TABLE job_orders ADD COLUMN delivery_reference_id INT NULL AFTER delivery_location_type;

-- Initialize existing records to CUSTOM so their existing manual pickup_location / pickup_address are preserved without confusion
UPDATE job_orders SET pickup_location_type = 'CUSTOM' WHERE pickup_location_type IS NULL AND pickup_location IS NOT NULL;
UPDATE job_orders SET delivery_location_type = 'CUSTOM' WHERE delivery_location_type IS NULL AND delivery_location IS NOT NULL;
