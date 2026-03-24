CREATE TABLE IF NOT EXISTS floor_molds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  name VARCHAR(5) NOT NULL,
  lid_mold_id INT NULL,
  sizes JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_floor_molds_brand (brand_id),
  INDEX idx_floor_molds_lid (lid_mold_id)
);
