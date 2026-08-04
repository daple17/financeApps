-- 1. Add account subtype and posting flag to accounts
ALTER TABLE accounts ADD COLUMN account_subtype VARCHAR(50) NULL;
ALTER TABLE accounts ADD COLUMN allow_posting BOOLEAN DEFAULT TRUE;

-- Backfill Cash/Bank accounts based on code (11xx or 12xx)
UPDATE accounts 
SET account_subtype = 'CASH_BANK' 
WHERE code LIKE '11%' OR code LIKE '12%';

-- 2. Create System Account Mappings Table
CREATE TABLE IF NOT EXISTS system_account_mappings (
  mapping_key VARCHAR(50) PRIMARY KEY,
  account_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- Backfill OPERATIONAL_ADVANCE_CLEARING
INSERT INTO system_account_mappings (mapping_key, account_id)
SELECT 'OPERATIONAL_ADVANCE_CLEARING', id FROM accounts WHERE code = '1300'
ON DUPLICATE KEY UPDATE account_id = VALUES(account_id);

-- 3. Add mapping snapshot to settlement_items
ALTER TABLE settlement_items ADD COLUMN expense_account_id INT NULL;
ALTER TABLE settlement_items ADD COLUMN expense_account_code_snapshot VARCHAR(50) NULL;
ALTER TABLE settlement_items ADD COLUMN expense_account_name_snapshot VARCHAR(100) NULL;
ALTER TABLE settlement_items ADD CONSTRAINT fk_si_expense_account FOREIGN KEY (expense_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;

-- 4. Backfill existing settlement_items for APPROVED settlements
UPDATE settlement_items si
JOIN settlements s ON si.settlement_id = s.id
JOIN operation_costs oc ON si.operation_cost_id = oc.id
JOIN cost_type_account_mappings ctam ON oc.cost_type = ctam.cost_type
JOIN accounts a ON ctam.account_id = a.id
SET 
  si.expense_account_id = a.id,
  si.expense_account_code_snapshot = a.code,
  si.expense_account_name_snapshot = a.name
WHERE s.status = 'APPROVED' 
  AND ctam.is_active = TRUE;
