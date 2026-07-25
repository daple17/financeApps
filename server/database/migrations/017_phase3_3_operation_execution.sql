-- Migration: 017_phase3_3_operation_execution.sql
-- Description: Add execution timestamp tracking and cancellation details to operations table

ALTER TABLE operations
ADD COLUMN actual_start_at DATETIME NULL,
ADD COLUMN arrived_pickup_at DATETIME NULL,
ADD COLUMN picked_up_at DATETIME NULL,
ADD COLUMN in_transit_at DATETIME NULL,
ADD COLUMN arrived_destination_at DATETIME NULL,
ADD COLUMN delivered_at DATETIME NULL,
ADD COLUMN actual_completion_at DATETIME NULL,
ADD COLUMN cancelled_at DATETIME NULL,
ADD COLUMN cancelled_by INT NULL,
ADD COLUMN cancellation_reason TEXT NULL,
ADD CONSTRAINT fk_operation_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL;
