-- Additive migration for Phase 1.5: Job Order Stabilization

-- 1. Migrate duplicate cargo data from trucking_details back to job_orders where it's LCL/BB.
-- We use COALESCE to ensure we don't overwrite existing job_orders cargo data if it already exists.
UPDATE job_orders jo
JOIN trucking_details td ON jo.id = td.job_order_id
SET 
  jo.cargo_weight = COALESCE(jo.cargo_weight, td.weight),
  jo.cargo_volume = COALESCE(jo.cargo_volume, td.volume),
  jo.cargo_quantity = COALESCE(jo.cargo_quantity, td.quantity),
  jo.cargo_unit = COALESCE(jo.cargo_unit, td.unit)
WHERE td.party_volume_type = 'LCL/BB';

-- 2. Drop the redundant cargo columns from trucking_details to enforce Single Source of Truth
ALTER TABLE trucking_details 
  DROP COLUMN weight,
  DROP COLUMN volume,
  DROP COLUMN quantity,
  DROP COLUMN unit;

-- 3. Add Indexes for better query performance
CREATE INDEX idx_job_orders_status ON job_orders(job_status);
CREATE INDEX idx_job_orders_type ON job_orders(job_order_type);
CREATE INDEX idx_job_orders_date ON job_orders(job_date);
