ALTER TABLE vendor_invoice_items
ADD COLUMN expense_account_id INT NULL,
ADD COLUMN expense_account_code_snapshot VARCHAR(50) NULL,
ADD COLUMN expense_account_name_snapshot VARCHAR(150) NULL;

ALTER TABLE vendor_invoice_items
ADD FOREIGN KEY (expense_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;

-- Backfill for any existing APPROVED or further status invoices
-- (Safeguard per user instructions, ensures unambigious mapping)
UPDATE vendor_invoice_items vii
JOIN vendor_invoices vi ON vii.vendor_invoice_id = vi.id
JOIN operation_costs oc ON vii.operation_cost_id = oc.id
JOIN cost_type_account_mappings ctam ON oc.cost_type = ctam.cost_type
JOIN accounts a ON ctam.account_id = a.id
SET 
  vii.expense_account_id = a.id,
  vii.expense_account_code_snapshot = a.code,
  vii.expense_account_name_snapshot = a.name
WHERE vi.status IN ('APPROVED', 'POSTED', 'PARTIALLY_PAID', 'PAID')
  AND ctam.is_active = TRUE
  AND a.is_active = TRUE
  AND vii.expense_account_id IS NULL;
