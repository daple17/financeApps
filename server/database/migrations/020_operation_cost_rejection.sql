-- Description: Add rejection_reason to operation_costs
-- Supports Finance Approval Flow rejections

ALTER TABLE operation_costs 
ADD COLUMN rejection_reason VARCHAR(255) DEFAULT NULL;
