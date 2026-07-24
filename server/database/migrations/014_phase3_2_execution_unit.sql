-- Migration script 014_phase3_2_execution_unit.sql

ALTER TABLE operations ADD COLUMN execution_unit VARCHAR(50) NULL AFTER execution_quantity;
