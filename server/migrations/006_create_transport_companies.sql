CREATE TABLE IF NOT EXISTS transport_companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transport_code VARCHAR(20) NOT NULL UNIQUE,
  company_name VARCHAR(200) NOT NULL,
  type ENUM('company','hired_truck','internal') NOT NULL DEFAULT 'company',
  tax_id VARCHAR(20),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  contact_person VARCHAR(100),
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)