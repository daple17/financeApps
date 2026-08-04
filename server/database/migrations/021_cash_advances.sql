CREATE TABLE IF NOT EXISTS cash_advances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  advance_no VARCHAR(50) NOT NULL UNIQUE,
  advance_scope ENUM('OPERATION', 'JOB_ORDER', 'GENERAL') NOT NULL,
  
  job_order_id INT NULL,
  operation_id INT NULL,
  
  driver_id INT NULL,
  user_id INT NULL,
  
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'IDR',
  
  purpose VARCHAR(255) NOT NULL,
  request_date DATE NOT NULL,
  
  status VARCHAR(20) DEFAULT 'DRAFT',
  
  notes TEXT NULL,
  
  approved_by INT NULL,
  approved_at DATETIME NULL,
  disbursed_by INT NULL,
  disbursed_at DATETIME NULL,
  transaction_id INT NULL,
  
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE RESTRICT,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (disbursed_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_cash_advances_status ON cash_advances(status);
CREATE INDEX idx_cash_advances_scope ON cash_advances(advance_scope);
CREATE INDEX idx_cash_advances_job_order ON cash_advances(job_order_id);
CREATE INDEX idx_cash_advances_operation ON cash_advances(operation_id);
CREATE INDEX idx_cash_advances_driver ON cash_advances(driver_id);
CREATE INDEX idx_cash_advances_user ON cash_advances(user_id);
