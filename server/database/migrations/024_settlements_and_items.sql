CREATE TABLE IF NOT EXISTS settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settlement_no VARCHAR(50) NOT NULL UNIQUE,
  cash_advance_id INT NOT NULL UNIQUE,
  total_advance DECIMAL(15,2) NOT NULL,
  total_expense DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  difference DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'DRAFT',
  settlement_date DATE NOT NULL,
  notes TEXT NULL,
  rejection_reason TEXT NULL,
  
  submitted_by INT NULL,
  submitted_at DATETIME NULL,
  
  approved_by INT NULL,
  approved_at DATETIME NULL,
  
  posted_by INT NULL,
  posted_at DATETIME NULL,
  
  transaction_id INT NULL,
  
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cash_advance_id) REFERENCES cash_advances(id) ON DELETE RESTRICT,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_settlements_status ON settlements(status);

CREATE TABLE IF NOT EXISTS settlement_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settlement_id INT NOT NULL,
  operation_cost_id INT NOT NULL UNIQUE,
  settled_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE,
  FOREIGN KEY (operation_cost_id) REFERENCES operation_costs(id) ON DELETE RESTRICT
);
