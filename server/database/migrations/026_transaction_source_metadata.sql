-- Migration 026: Add source document tracking to transactions
-- This allows precise backward navigation and immutability for system-generated transactions

ALTER TABLE transactions 
ADD COLUMN source_type VARCHAR(50) NULL DEFAULT NULL,
ADD COLUMN source_id INT NULL DEFAULT NULL,
ADD COLUMN source_number VARCHAR(50) NULL DEFAULT NULL,
ADD COLUMN is_system_generated BOOLEAN NOT NULL DEFAULT 0,
ADD INDEX idx_txn_source (source_type, source_id);

-- Note: The backfill is explicitly executed via a Node.js script (server/scripts/run_migration_026.js) 
-- to safely detect and skip conflicts.
