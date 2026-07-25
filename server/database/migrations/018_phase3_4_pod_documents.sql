-- Migration: 018_phase3_4_pod_documents.sql
-- Description: Create tables for operation documents and proof of delivery

CREATE TABLE operation_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100),
  document_date DATE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  file_size INT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'SUBMITTED',
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operation_id) REFERENCES operations(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE operation_pods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_id INT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  recipient_company VARCHAR(100),
  recipient_phone VARCHAR(50),
  delivery_date DATE NOT NULL,
  delivery_time TIME NOT NULL,
  delivery_notes TEXT,
  received_condition VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'SUBMITTED',
  submitted_by INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by INT,
  verified_at TIMESTAMP NULL,
  rejected_by INT,
  rejected_at TIMESTAMP NULL,
  rejection_reason TEXT,
  FOREIGN KEY (operation_id) REFERENCES operations(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id)
);
