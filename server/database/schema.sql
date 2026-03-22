-- =============================================
-- DATABASE: deblu_erp
-- =============================================

CREATE DATABASE IF NOT EXISTS deblu_erp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE deblu_erp;

-- =============================================
-- 1. EMPLOYEES
-- =============================================

CREATE TABLE IF NOT EXISTS positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_th VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employment_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  name_th VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  prefix VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  id_card_number VARCHAR(13) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  position_id INT,
  employment_type_id INT,
  base_salary DECIMAL(12,2) DEFAULT 0,
  has_ot BOOLEAN DEFAULT FALSE,
  ot_rate_multiplier DECIMAL(3,1) DEFAULT 1.5,
  hire_date DATE,
  status ENUM('active', 'resigned', 'suspended') DEFAULT 'active',
  profile_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (position_id) REFERENCES positions(id),
  FOREIGN KEY (employment_type_id) REFERENCES employment_types(id)
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  document_type ENUM('id_card', 'contract', 'other') NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- =============================================
-- 2. BRANDS
-- =============================================

CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  logo_image VARCHAR(500),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 3. MODELS
-- =============================================

CREATE TABLE IF NOT EXISTS models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(5) NOT NULL,
  name VARCHAR(100) NOT NULL,
  brand_id INT NOT NULL,
  model_image VARCHAR(500),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  UNIQUE KEY unique_brand_model_code (brand_id, code)
);

-- =============================================
-- 4. VERSIONS
-- =============================================

CREATE TABLE IF NOT EXISTS versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 5. PRODUCT CATEGORIES
-- =============================================

CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 6. PRODUCTION METHODS
-- =============================================

CREATE TABLE IF NOT EXISTS production_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 7. COLORS
-- =============================================

CREATE TABLE IF NOT EXISTS colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(3) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  hex_code VARCHAR(7),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 8. SIZES
-- =============================================

CREATE TABLE IF NOT EXISTS sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(2) NOT NULL UNIQUE,
  size_value VARCHAR(10) NOT NULL,
  size_system ENUM('EU', 'US', 'UK') DEFAULT 'EU',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 9. GENDERS
-- =============================================

CREATE TABLE IF NOT EXISTS genders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  name_th VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 10. PROVINCES & REGIONS
-- =============================================

CREATE TABLE IF NOT EXISTS provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_th VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_th VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS region_provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region_id INT NOT NULL,
  province_id INT NOT NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE,
  UNIQUE KEY unique_region_province (region_id, province_id)
);

-- =============================================
-- 11. CUSTOMERS
-- =============================================

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_code VARCHAR(20) NOT NULL UNIQUE,
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(150),
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  province_id INT,
  region_id INT,
  credit_terms INT DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- =============================================
-- 12. DISCOUNT CODES
-- =============================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  start_date DATE,
  end_date DATE,
  max_usage INT DEFAULT NULL,
  current_usage INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 13. COMMISSION RULES
-- =============================================

CREATE TABLE IF NOT EXISTS commission_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  condition_type ENUM('before_delivery', 'within_credit', 'after_credit') NOT NULL,
  days_after_credit INT DEFAULT NULL,
  commission_percent DECIMAL(5,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 14. PRODUCTS
-- =============================================

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(16) NOT NULL UNIQUE,
  brand_id INT NOT NULL,
  model_id INT NOT NULL,
  version_id INT NOT NULL,
  product_category_id INT NOT NULL,
  production_method_id INT NOT NULL,
  gender_id INT NOT NULL,
  color_id INT NOT NULL,
  size_id INT NOT NULL,
  product_name VARCHAR(300),
  cost_price DECIMAL(12,2) DEFAULT 0,
  selling_price DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (model_id) REFERENCES models(id),
  FOREIGN KEY (version_id) REFERENCES versions(id),
  FOREIGN KEY (product_category_id) REFERENCES product_categories(id),
  FOREIGN KEY (production_method_id) REFERENCES production_methods(id),
  FOREIGN KEY (gender_id) REFERENCES genders(id),
  FOREIGN KEY (color_id) REFERENCES colors(id),
  FOREIGN KEY (size_id) REFERENCES sizes(id),
  UNIQUE KEY unique_product_combination (brand_id, model_id, version_id, product_category_id, production_method_id, gender_id, color_id, size_id)
);

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================
-- 15. USERS & AUTH
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  employee_id INT,
  role ENUM('admin', 'manager', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
