CREATE TABLE IF NOT EXISTS customer_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  phone VARCHAR(50),
  phone_backup VARCHAR(50),
  email VARCHAR(100),
  line_id VARCHAR(100),
  facebook VARCHAR(100),
  contact_name VARCHAR(100),
  contact_position VARCHAR(100),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
)