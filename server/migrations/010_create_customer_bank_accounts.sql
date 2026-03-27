CREATE TABLE IF NOT EXISTS customer_bank_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_name VARCHAR(100),
  is_primary TINYINT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
)