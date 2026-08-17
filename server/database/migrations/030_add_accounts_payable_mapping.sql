-- Migration 030: Add ACCOUNTS_PAYABLE system mapping
INSERT IGNORE INTO system_account_mappings (mapping_key, account_id)
SELECT 'ACCOUNTS_PAYABLE', id 
FROM accounts 
WHERE code = '2100' OR name LIKE '%Hutang%' OR name LIKE '%Accounts Payable%'
LIMIT 1;
