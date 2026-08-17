-- Phase 5.6 Vendor Payments

CREATE TABLE IF NOT EXISTS vendor_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_no VARCHAR(50) UNIQUE NOT NULL,
  payment_date DATE NOT NULL,
  vendor_id INT NOT NULL,
  cash_account_id INT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  status ENUM('POSTED', 'CANCELLED') NOT NULL DEFAULT 'POSTED',
  transaction_id INT,
  
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendor_id) REFERENCES business_partners(id) ON DELETE RESTRICT,
  FOREIGN KEY (cash_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendor_payment_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_payment_id INT NOT NULL,
  vendor_invoice_id INT NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_payment_invoice (vendor_payment_id, vendor_invoice_id),
  FOREIGN KEY (vendor_payment_id) REFERENCES vendor_payments(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_invoice_id) REFERENCES vendor_invoices(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
