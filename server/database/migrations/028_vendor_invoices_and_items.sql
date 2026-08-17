CREATE TABLE IF NOT EXISTS vendor_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ap_invoice_no VARCHAR(50) NOT NULL UNIQUE,
  vendor_invoice_number VARCHAR(100) NOT NULL,
  normalized_invoice_number VARCHAR(100) NOT NULL,
  vendor_id INT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'POSTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'VOIDED') NOT NULL DEFAULT 'DRAFT',
  notes TEXT,
  rejection_reason TEXT,
  
  submitted_by INT,
  submitted_at TIMESTAMP NULL,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  posted_by INT,
  posted_at TIMESTAMP NULL,
  paid_by INT,
  paid_at TIMESTAMP NULL,
  
  transaction_id INT,
  
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_vendor_normalized_inv (vendor_id, normalized_invoice_number),
  FOREIGN KEY (vendor_id) REFERENCES business_partners(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendor_invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_invoice_id INT NOT NULL,
  operation_cost_id INT NOT NULL UNIQUE,
  invoice_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendor_invoice_id) REFERENCES vendor_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (operation_cost_id) REFERENCES operation_costs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
