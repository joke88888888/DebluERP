CREATE TABLE IF NOT EXISTS customer_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  document_type ENUM('vat_cert','company_cert','id_card','house_reg','shop_photo','other') NOT NULL DEFAULT 'other',
  document_name VARCHAR(200),
  file_path VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
)