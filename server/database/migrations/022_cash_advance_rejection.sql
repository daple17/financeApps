-- Migration 022: Add Rejection Reason to Cash Advances

ALTER TABLE cash_advances
ADD COLUMN rejection_reason TEXT NULL AFTER status;
