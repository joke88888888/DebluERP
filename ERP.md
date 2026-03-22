# Deblu ERP - ระบบ ERP โรงงานผลิตรองเท้า

## สารบัญ

1. [ภาพรวมโครงการ](#1-ภาพรวมโครงการ)
2. [Tech Stack](#2-tech-stack)
3. [โครงสร้างโปรเจค](#3-โครงสร้างโปรเจค)
4. [Phase 1 - Master Data](#4-phase-1---master-data)
5. [Database Schema](#5-database-schema)
6. [SKU Auto-Generation](#6-sku-auto-generation)
7. [API Endpoints](#7-api-endpoints)
8. [UI/UX Guidelines](#8-uiux-guidelines)
9. [Phase 2 & 3 (Future)](#9-phase-2--3-future)

---

## 1. ภาพรวมโครงการ

ระบบ ERP สำหรับโรงงานผลิตรองเท้า รองรับหลายแบรนด์ หลายรุ่น หลายสี หลาย Size
แบ่งการพัฒนาออกเป็น 3 เฟส โดยเฟส 1 เน้น **Master Data** เป็นหลัก

### Phases Overview

| Phase | ขอบเขต | สถานะ |
|-------|--------|-------|
| Phase 1 | Master Data (ข้อมูลหลักทั้งหมด) | 🔴 กำลังดำเนินการ |
| Phase 2 | Sales, Orders, Inventory (การขาย, คำสั่งซื้อ, คลังสินค้า) | ⚪ รอ |
| Phase 3 | Production, Accounting, Reports (การผลิต, บัญชี, รายงาน) | ⚪ รอ |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Material UI (MUI) |
| Backend | Node.js (Express.js) |
| Database | MySQL |
| File Upload | Multer (local storage) หรือ cloud storage |
| Authentication | JWT |

### Database Connection

```
Host: localhost
User: DebluERP
Password: deblu12345678
Database: deblu_erp
```

---

## 3. โครงสร้างโปรเจค

```
deblu-erp/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Shared components
│   │   │   ├── layout/         # Sidebar, Header, Footer
│   │   │   ├── common/         # Tables, Forms, Dialogs, Upload
│   │   │   └── ui/             # Buttons, Inputs, Cards
│   │   ├── pages/              # Page components
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── brands/
│   │   │   ├── models/
│   │   │   ├── products/
│   │   │   ├── colors/
│   │   │   ├── sizes/
│   │   │   ├── categories/
│   │   │   ├── production-methods/
│   │   │   ├── versions/
│   │   │   ├── genders/
│   │   │   ├── regions/
│   │   │   ├── customers/
│   │   │   ├── discount-codes/
│   │   │   └── commission-rules/
│   │   ├── services/           # API calls (axios)
│   │   ├── hooks/              # Custom hooks
│   │   ├── context/            # React Context (Auth, Theme)
│   │   ├── utils/              # Helpers, formatters
│   │   └── App.jsx
│   └── package.json
│
├── server/                     # Node.js Backend
│   ├── config/
│   │   └── db.js               # MySQL connection
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js           # Multer config
│   │   └── validate.js
│   ├── uploads/                # Uploaded files storage
│   ├── utils/
│   │   └── skuGenerator.js     # SKU auto-generation
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/              # Seed data (provinces, etc.)
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## 4. Phase 1 - Master Data

### 4.1 พนักงาน (Employees)

ข้อมูลพนักงานทั้งหมดในโรงงาน พร้อมอัพโหลดเอกสารและรูปภาพ

**ฟิลด์หลัก:**
- รหัสพนักงาน (auto-generate)
- คำนำหน้า, ชื่อ, นามสกุล
- เลขบัตรประชาชน
- เบอร์โทร, อีเมล
- ที่อยู่
- วันที่เริ่มงาน
- สถานะ (ทำงาน/ลาออก/พักงาน)

**ตำแหน่ง (positions):**
- ผู้บริหาร (Executive)
- การเงิน (Finance)
- HR
- ฝ่ายผลิต - รายวัน (Production - Daily)
- ฝ่ายผลิต - รายเดือน (Production - Monthly)
- ฝ่ายผลิต - รายชิ้น (Production - Piece Rate)
- Sales
- หัวหน้า Sales (Sales Manager)

**ประเภทการจ้าง (employment types):**
- รายเดือน (Monthly)
- รายวัน (Daily)
- รายชิ้น (Piece Rate)

**เงินเดือนและ OT:**
- เงินเดือนพื้นฐาน / ค่าแรงรายวัน / อัตราต่อชิ้น
- OT: มี OT / ไม่มี OT
- อัตรา OT (x1.5, x2, x3 ตามกฎหมายแรงงาน)

**เอกสารที่อัพโหลดได้:**
- รูปถ่ายพนักงาน (profile photo)
- สำเนาบัตรประชาชน
- สัญญาการจ้างงาน
- เอกสารอื่นๆ ที่สำคัญ (multiple files)

---

### 4.2 แบรนด์ (Brands)

- รหัสแบรนด์ (1 digit code: A, B, C, ... สำหรับ SKU)
- ชื่อแบรนด์
- รูปโลโก้แบรนด์ (upload image)
- คำอธิบาย
- สถานะ (active/inactive)

---

### 4.3 รุ่น (Models)

- รหัสรุ่น (5 digit code สำหรับ SKU)
- ชื่อรุ่น
- แบรนด์ที่สังกัด (FK → brands)
- รูปรุ่น (upload image)
- คำอธิบาย
- สถานะ (active/inactive)

---

### 4.4 เวอร์ชันที่ผลิต (Versions)

- รหัสเวอร์ชัน (1 digit code สำหรับ SKU)
- ชื่อเวอร์ชัน
- คำอธิบาย
- สถานะ (active/inactive)

---

### 4.5 ประเภทสินค้า (Product Categories)

- รหัสประเภท (1 digit code สำหรับ SKU)
- ชื่อประเภท
- คำอธิบาย
- สถานะ (active/inactive)

---

### 4.6 วิธีการผลิต (Production Methods)

- รหัสวิธีการผลิต (1 digit code สำหรับ SKU)
- ชื่อวิธีการผลิต
- คำอธิบาย
- สถานะ (active/inactive)

---

### 4.7 สี (Colors)

- รหัสสี (3 digit code สำหรับ SKU)
- ชื่อสี
- รหัสสี HEX (สำหรับแสดงผลใน UI)
- สถานะ (active/inactive)

---

### 4.8 ขนาด (Sizes)

- รหัสขนาด (2 digit code สำหรับ SKU)
- ขนาด (เช่น 36, 37, 38, 39, 40, 41, 42, 43, 44, 45)
- ระบบขนาด (EU/US/UK)
- สถานะ (active/inactive)

---

### 4.9 เพศ (Genders)

- รหัสเพศ (1 digit code สำหรับ SKU)
- ชื่อ (ชาย/หญิง/Unisex)
- สถานะ (active/inactive)

---

### 4.10 ภูมิภาค (Regions)

- รหัสภูมิภาค
- ชื่อภูมิภาค
- จังหวัดที่อยู่ในภูมิภาค (many-to-many กับ provinces)
- สถานะ (active/inactive)

**จังหวัดทั้ง 77 จังหวัด** (รวมกรุงเทพฯ): seed ลง database ให้เรียบร้อย
- UI: สามารถพิมพ์ค้นหาจังหวัดได้ (Autocomplete/Search)
- สามารถเลือกหลายจังหวัดเข้าในแต่ละภูมิภาคได้

---

### 4.11 ร้านค้า/ลูกค้าขายส่ง (Customers)

- รหัสลูกค้า (auto-generate)
- ชื่อร้านค้า/บริษัท
- ชื่อผู้ติดต่อ
- เบอร์โทร, อีเมล
- ที่อยู่ (เต็ม)
- จังหวัด (FK → provinces)
- ภูมิภาค (FK → regions)
- เงื่อนไขการจ่ายเงิน (credit terms - จำนวนวัน เช่น 30, 60, 90 วัน)
- ส่วนลด (%)
- วงเงินเครดิต (Credit Limit - จำนวนเงิน)
- สถานะ (active/inactive)

---

### 4.12 โค้ดส่วนลด (Discount Codes)

- รหัสส่วนลด (code)
- ชื่อส่วนลด
- ประเภท (เปอร์เซ็นต์ / จำนวนเงินคงที่)
- มูลค่าส่วนลด
- วันที่เริ่ม - วันที่สิ้นสุด
- จำนวนครั้งที่ใช้ได้ (หรือไม่จำกัด)
- สถานะ (active/inactive)

---

### 4.13 เงื่อนไข Commission สำหรับ Sales (Commission Rules)

กำหนดเงื่อนไขค่าคอมมิชชัน 3 ระดับ ตามการรับเงินจากลูกค้า

| เงื่อนไข | ตัวอย่าง | Commission % |
|-----------|----------|-------------|
| เงื่อนไข 1 | เก็บเงินสดได้ก่อนส่งสินค้า | สูงสุด (เช่น 5%) |
| เงื่อนไข 2 | รับเงินภายในเครดิต (ตรงเวลา) | ปานกลาง (เช่น 3%) |
| เงื่อนไข 3 | รับเงินหลังเครดิต X วัน | ต่ำสุด (เช่น 1%) |

**ฟิลด์:**
- ชื่อเงื่อนไข
- ประเภท: ก่อนส่งสินค้า (before_delivery) / ภายในเครดิต (within_credit) / หลังเครดิต (after_credit)
- จำนวนวันหลังเครดิต (สำหรับประเภท after_credit)
- เปอร์เซ็นต์ commission จากยอดขาย
- สถานะ (active/inactive)

---

### 4.14 สินค้า (Products / SKU)

สินค้าเกิดจากการเชื่อมโยง Master Data ต่างๆ เข้าด้วยกัน

**ฟิลด์:**
- SKU Code (14 หลัก - **auto-generate** ดูรายละเอียดใน Section 6)
- แบรนด์ (FK → brands)
- รุ่น (FK → models)
- เวอร์ชัน (FK → versions)
- ประเภทสินค้า (FK → product_categories)
- วิธีการผลิต (FK → production_methods)
- เพศ (FK → genders)
- สี (FK → colors)
- ขนาด (FK → sizes)
- ชื่อสินค้า (auto-generate จาก brand + model + color + size)
- ราคาต้นทุน
- ราคาขาย
- รูปสินค้า (upload images - multiple)
- สถานะ (active/inactive)

---

## 5. Database Schema

### 5.1 ตาราง Master Data

```sql
-- =============================================
-- DATABASE: deblu_erp
-- =============================================

CREATE DATABASE IF NOT EXISTS deblu_erp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE deblu_erp;

-- =============================================
-- 1. EMPLOYEES (พนักงาน)
-- =============================================

CREATE TABLE positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_th VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE employment_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,          -- Monthly, Daily, Piece Rate
  name_th VARCHAR(50) NOT NULL,       -- รายเดือน, รายวัน, รายชิ้น
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(20) NOT NULL UNIQUE,     -- EMP-XXXX auto-generate
  prefix VARCHAR(20),                             -- นาย, นาง, นางสาว
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  id_card_number VARCHAR(13) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  position_id INT,
  employment_type_id INT,
  base_salary DECIMAL(12,2) DEFAULT 0,            -- เงินเดือน/ค่าแรงรายวัน/อัตราต่อชิ้น
  has_ot BOOLEAN DEFAULT FALSE,
  ot_rate_multiplier DECIMAL(3,1) DEFAULT 1.5,    -- x1.5, x2, x3
  hire_date DATE,
  status ENUM('active', 'resigned', 'suspended') DEFAULT 'active',
  profile_image VARCHAR(500),                      -- path to profile photo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (position_id) REFERENCES positions(id),
  FOREIGN KEY (employment_type_id) REFERENCES employment_types(id)
);

CREATE TABLE employee_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  document_type ENUM('id_card', 'contract', 'other') NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- =============================================
-- 2. BRANDS (แบรนด์)
-- =============================================

CREATE TABLE brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,          -- 1 digit for SKU (A, B, C...)
  name VARCHAR(100) NOT NULL,
  logo_image VARCHAR(500),                -- path to logo
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 3. MODELS (รุ่น)
-- =============================================

CREATE TABLE models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(5) NOT NULL,                  -- 5 digit for SKU
  name VARCHAR(100) NOT NULL,
  brand_id INT NOT NULL,
  model_image VARCHAR(500),               -- path to model image
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  UNIQUE KEY unique_brand_model_code (brand_id, code)
);

-- =============================================
-- 4. VERSIONS (เวอร์ชัน)
-- =============================================

CREATE TABLE versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,           -- 1 digit for SKU
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 5. PRODUCT CATEGORIES (ประเภทสินค้า)
-- =============================================

CREATE TABLE product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,           -- 1 digit for SKU
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 6. PRODUCTION METHODS (วิธีการผลิต)
-- =============================================

CREATE TABLE production_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,           -- 1 digit for SKU
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 7. COLORS (สี)
-- =============================================

CREATE TABLE colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(3) NOT NULL UNIQUE,           -- 3 digit for SKU
  name VARCHAR(100) NOT NULL,
  hex_code VARCHAR(7),                     -- #FF0000 for UI display
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 8. SIZES (ขนาด)
-- =============================================

CREATE TABLE sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(2) NOT NULL UNIQUE,           -- 2 digit for SKU
  size_value VARCHAR(10) NOT NULL,         -- 36, 37, 38...
  size_system ENUM('EU', 'US', 'UK') DEFAULT 'EU',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 9. GENDERS (เพศ)
-- =============================================

CREATE TABLE genders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code CHAR(1) NOT NULL UNIQUE,           -- 1 digit for SKU (M, F, U)
  name VARCHAR(50) NOT NULL,              -- Male, Female, Unisex
  name_th VARCHAR(50) NOT NULL,           -- ชาย, หญิง, Unisex
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 10. PROVINCES & REGIONS (จังหวัดและภูมิภาค)
-- =============================================

CREATE TABLE provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_th VARCHAR(100) NOT NULL,          -- ชื่อจังหวัดภาษาไทย
  name_en VARCHAR(100) NOT NULL           -- ชื่อจังหวัดภาษาอังกฤษ
);

CREATE TABLE regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_th VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE region_provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region_id INT NOT NULL,
  province_id INT NOT NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE,
  UNIQUE KEY unique_region_province (region_id, province_id)
);

-- =============================================
-- 11. CUSTOMERS (ร้านค้า/ลูกค้าขายส่ง)
-- =============================================

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_code VARCHAR(20) NOT NULL UNIQUE,  -- CUST-XXXX auto-generate
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(150),
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  province_id INT,
  region_id INT,
  credit_terms INT DEFAULT 0,                  -- จำนวนวันเครดิต (30, 60, 90)
  discount_percent DECIMAL(5,2) DEFAULT 0,     -- ส่วนลด %
  credit_limit DECIMAL(15,2) DEFAULT 0,        -- วงเงินเครดิต
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- =============================================
-- 12. DISCOUNT CODES (โค้ดส่วนลด)
-- =============================================

CREATE TABLE discount_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,       -- % or fixed amount
  start_date DATE,
  end_date DATE,
  max_usage INT DEFAULT NULL,                   -- NULL = unlimited
  current_usage INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 13. COMMISSION RULES (เงื่อนไข Commission)
-- =============================================

CREATE TABLE commission_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  condition_type ENUM('before_delivery', 'within_credit', 'after_credit') NOT NULL,
  days_after_credit INT DEFAULT NULL,          -- สำหรับ after_credit เท่านั้น
  commission_percent DECIMAL(5,2) NOT NULL,    -- % จากยอดขาย
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 14. PRODUCTS (สินค้า / SKU)
-- =============================================

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(16) NOT NULL UNIQUE,             -- 14-digit + # + 2-digit size
  brand_id INT NOT NULL,
  model_id INT NOT NULL,
  version_id INT NOT NULL,
  product_category_id INT NOT NULL,
  production_method_id INT NOT NULL,
  gender_id INT NOT NULL,
  color_id INT NOT NULL,
  size_id INT NOT NULL,
  product_name VARCHAR(300),                    -- auto-generate from masters
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

CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================
-- 15. USERS & AUTH (สำหรับ Login ระบบ)
-- =============================================

CREATE TABLE users (
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
```

### 5.2 Seed Data - 77 จังหวัด

```sql
INSERT INTO provinces (name_th, name_en) VALUES
('กรุงเทพมหานคร', 'Bangkok'),
('กระบี่', 'Krabi'),
('กาญจนบุรี', 'Kanchanaburi'),
('กาฬสินธุ์', 'Kalasin'),
('กำแพงเพชร', 'Kamphaeng Phet'),
('ขอนแก่น', 'Khon Kaen'),
('จันทบุรี', 'Chanthaburi'),
('ฉะเชิงเทรา', 'Chachoengsao'),
('ชลบุรี', 'Chonburi'),
('ชัยนาท', 'Chainat'),
('ชัยภูมิ', 'Chaiyaphum'),
('ชุมพร', 'Chumphon'),
('เชียงราย', 'Chiang Rai'),
('เชียงใหม่', 'Chiang Mai'),
('ตรัง', 'Trang'),
('ตราด', 'Trat'),
('ตาก', 'Tak'),
('นครนายก', 'Nakhon Nayok'),
('นครปฐม', 'Nakhon Pathom'),
('นครพนม', 'Nakhon Phanom'),
('นครราชสีมา', 'Nakhon Ratchasima'),
('นครศรีธรรมราช', 'Nakhon Si Thammarat'),
('นครสวรรค์', 'Nakhon Sawan'),
('นนทบุรี', 'Nonthaburi'),
('นราธิวาส', 'Narathiwat'),
('น่าน', 'Nan'),
('บึงกาฬ', 'Bueng Kan'),
('บุรีรัมย์', 'Buriram'),
('ปทุมธานี', 'Pathum Thani'),
('ประจวบคีรีขันธ์', 'Prachuap Khiri Khan'),
('ปราจีนบุรี', 'Prachinburi'),
('ปัตตานี', 'Pattani'),
('พระนครศรีอยุธยา', 'Phra Nakhon Si Ayutthaya'),
('พะเยา', 'Phayao'),
('พังงา', 'Phang Nga'),
('พัทลุง', 'Phatthalung'),
('พิจิตร', 'Phichit'),
('พิษณุโลก', 'Phitsanulok'),
('เพชรบุรี', 'Phetchaburi'),
('เพชรบูรณ์', 'Phetchabun'),
('แพร่', 'Phrae'),
('ภูเก็ต', 'Phuket'),
('มหาสารคาม', 'Maha Sarakham'),
('มุกดาหาร', 'Mukdahan'),
('แม่ฮ่องสอน', 'Mae Hong Son'),
('ยโสธร', 'Yasothon'),
('ยะลา', 'Yala'),
('ร้อยเอ็ด', 'Roi Et'),
('ระนอง', 'Ranong'),
('ระยอง', 'Rayong'),
('ราชบุรี', 'Ratchaburi'),
('ลพบุรี', 'Lopburi'),
('ลำปาง', 'Lampang'),
('ลำพูน', 'Lamphun'),
('เลย', 'Loei'),
('ศรีสะเกษ', 'Sisaket'),
('สกลนคร', 'Sakon Nakhon'),
('สงขลา', 'Songkhla'),
('สตูล', 'Satun'),
('สมุทรปราการ', 'Samut Prakan'),
('สมุทรสงคราม', 'Samut Songkhram'),
('สมุทรสาคร', 'Samut Sakhon'),
('สระแก้ว', 'Sa Kaeo'),
('สระบุรี', 'Saraburi'),
('สิงห์บุรี', 'Singburi'),
('สุโขทัย', 'Sukhothai'),
('สุพรรณบุรี', 'Suphan Buri'),
('สุราษฎร์ธานี', 'Surat Thani'),
('สุรินทร์', 'Surin'),
('หนองคาย', 'Nong Khai'),
('หนองบัวลำภู', 'Nong Bua Lamphu'),
('อ่างทอง', 'Ang Thong'),
('อำนาจเจริญ', 'Amnat Charoen'),
('อุดรธานี', 'Udon Thani'),
('อุตรดิตถ์', 'Uttaradit'),
('อุทัยธานี', 'Uthai Thani'),
('อุบลราชธานี', 'Ubon Ratchathani');
```

### 5.3 Seed Data - ตำแหน่ง & ประเภทการจ้าง

```sql
INSERT INTO positions (name, name_th) VALUES
('Executive', 'ผู้บริหาร'),
('Finance', 'การเงิน'),
('HR', 'ทรัพยากรบุคคล'),
('Production - Daily', 'ฝ่ายผลิต - รายวัน'),
('Production - Monthly', 'ฝ่ายผลิต - รายเดือน'),
('Production - Piece Rate', 'ฝ่ายผลิต - รายชิ้น'),
('Sales', 'ฝ่ายขาย'),
('Sales Manager', 'หัวหน้าฝ่ายขาย');

INSERT INTO employment_types (name, name_th) VALUES
('Monthly', 'รายเดือน'),
('Daily', 'รายวัน'),
('Piece Rate', 'รายชิ้น');

INSERT INTO genders (code, name, name_th) VALUES
('M', 'Male', 'ชาย'),
('F', 'Female', 'หญิง'),
('U', 'Unisex', 'Unisex');
```

---

## 6. SKU Auto-Generation

### รูปแบบ SKU: 14 หลัก + `#` + 2 หลัก = 17 ตัวอักษร

```
Position:  [1]  [2]  [3]  [4-8]  [9]  [10]  [11-13]  [14]  [15-16]
Field:     Brand Prod Gender Model  Ver  Cat   Color    #     Size
           Meth
Example:   A    1    M    00001   1    1     001      #     42
Full SKU:  A1M000011001#42
```

| ตำแหน่ง | หลัก | ข้อมูล | แหล่งที่มา |
|---------|------|--------|-----------|
| 1 | 1 digit | Brand Code | brands.code |
| 2 | 1 digit | Production Method Code | production_methods.code |
| 3 | 1 digit | Gender Code | genders.code |
| 4-8 | 5 digits | Model Code | models.code |
| 9 | 1 digit | Version Code | versions.code |
| 10 | 1 digit | Product Category Code | product_categories.code |
| 11-13 | 3 digits | Color Code | colors.code |
| 14 | 1 char | Separator '#' | คงที่ |
| 15-16 | 2 digits | Size Code | sizes.code |

### SKU Generation Logic (Backend)

```javascript
function generateSKU({ brandCode, productionMethodCode, genderCode, modelCode, versionCode, categoryCode, colorCode, sizeCode }) {
  return `${brandCode}${productionMethodCode}${genderCode}${modelCode}${versionCode}${categoryCode}${colorCode}#${sizeCode}`;
}

// Example: generateSKU({
//   brandCode: 'A',
//   productionMethodCode: '1',
//   genderCode: 'M',
//   modelCode: '00001',
//   versionCode: '1',
//   categoryCode: '1',
//   colorCode: '001',
//   sizeCode: '42'
// })
// Result: "A1M000011001#42"
```

---

## 7. API Endpoints

### Base URL: `http://localhost:3001/api`

### 7.1 Authentication

```
POST   /auth/login              # Login
POST   /auth/logout             # Logout
GET    /auth/me                 # Get current user
```

### 7.2 Employees

```
GET    /employees               # List all (pagination, search, filter)
GET    /employees/:id           # Get by ID
POST   /employees               # Create new
PUT    /employees/:id           # Update
DELETE /employees/:id           # Soft delete (set status)
POST   /employees/:id/documents # Upload document
DELETE /employees/:id/documents/:docId  # Delete document
POST   /employees/:id/profile-image     # Upload profile image
```

### 7.3 Brands

```
GET    /brands                  # List all
GET    /brands/:id              # Get by ID
POST   /brands                  # Create (with logo upload)
PUT    /brands/:id              # Update
DELETE /brands/:id              # Soft delete
```

### 7.4 Models

```
GET    /models                  # List all (filter by brand)
GET    /models/:id              # Get by ID
POST   /models                  # Create (with image upload)
PUT    /models/:id              # Update
DELETE /models/:id              # Soft delete
```

### 7.5 Simple Master Data (versions, categories, production_methods, colors, sizes, genders)

แต่ละตารางมี pattern เดียวกัน:

```
GET    /{resource}              # List all
GET    /{resource}/:id          # Get by ID
POST   /{resource}              # Create
PUT    /{resource}/:id          # Update
DELETE /{resource}/:id          # Soft delete
```

Resources: `versions`, `product-categories`, `production-methods`, `colors`, `sizes`, `genders`

### 7.6 Regions & Provinces

```
GET    /provinces               # List all 77 provinces (searchable)
GET    /regions                 # List all regions with provinces
GET    /regions/:id             # Get region with provinces
POST   /regions                 # Create region + assign provinces
PUT    /regions/:id             # Update region + reassign provinces
DELETE /regions/:id             # Soft delete
```

### 7.7 Customers

```
GET    /customers               # List all (pagination, search, filter by region)
GET    /customers/:id           # Get by ID
POST   /customers               # Create
PUT    /customers/:id           # Update
DELETE /customers/:id           # Soft delete
```

### 7.8 Discount Codes

```
GET    /discount-codes          # List all
GET    /discount-codes/:id      # Get by ID
POST   /discount-codes          # Create
PUT    /discount-codes/:id      # Update
DELETE /discount-codes/:id      # Soft delete
```

### 7.9 Commission Rules

```
GET    /commission-rules        # List all
GET    /commission-rules/:id    # Get by ID
POST   /commission-rules        # Create
PUT    /commission-rules/:id    # Update
DELETE /commission-rules/:id    # Soft delete
```

### 7.10 Products

```
GET    /products                # List all (pagination, filter by brand/model/color/size)
GET    /products/:id            # Get by ID with all master data
POST   /products                # Create (auto-generate SKU)
PUT    /products/:id            # Update
DELETE /products/:id            # Soft delete
POST   /products/:id/images     # Upload product images
DELETE /products/:id/images/:imgId  # Delete product image
GET    /products/check-sku/:sku # Check if SKU exists
```

---

## 8. UI/UX Guidelines

### 8.1 Layout

- **Sidebar Navigation** (MUI Drawer): เมนูหลักทางซ้าย collapsible
- **Top AppBar**: ชื่อระบบ, user info, logout
- **Content Area**: Main content with breadcrumbs

### 8.2 Sidebar Menu Structure

```
📊 Dashboard
👥 พนักงาน (Employees)
📦 สินค้า (Products)
   ├── 🏷️ แบรนด์ (Brands)
   ├── 📋 รุ่น (Models)
   ├── 🔢 เวอร์ชัน (Versions)
   ├── 📁 ประเภทสินค้า (Categories)
   ├── ⚙️ วิธีการผลิต (Production Methods)
   ├── 🎨 สี (Colors)
   ├── 📏 ขนาด (Sizes)
   ├── 🚻 เพศ (Genders)
   └── 📦 รายการสินค้า (Product List)
🗺️ ภูมิภาค (Regions)
🏪 ร้านค้า/ลูกค้า (Customers)
🏷️ โค้ดส่วนลด (Discount Codes)
💰 เงื่อนไข Commission (Commission Rules)
⚙️ ตั้งค่า (Settings)
```

### 8.3 Common UI Patterns

**Data Table (MUI DataGrid):**
- Pagination (25, 50, 100 per page)
- Search bar
- Column sorting
- Filter by status (active/inactive)
- Export (CSV, Excel) - optional

**Form Pattern:**
- MUI Dialog หรือ Full page form
- Validation แสดง error แบบ inline
- Upload preview สำหรับรูปภาพ
- Autocomplete สำหรับ dropdown ที่มีข้อมูลมาก (เช่น จังหวัด)

**Image Upload:**
- Drag & drop zone
- Preview thumbnail
- ลบรูปได้
- จำกัดขนาดไฟล์ (เช่น max 5MB)
- รองรับ jpg, png, webp

**Province Search (ภูมิภาค):**
- MUI Autocomplete with multiple selection
- พิมพ์ค้นหาได้ทั้งภาษาไทยและอังกฤษ
- แสดง chip สำหรับจังหวัดที่เลือกแล้ว

### 8.4 Theme

```javascript
// MUI Theme Configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',       // Blue
    },
    secondary: {
      main: '#dc004e',       // Pink/Red
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Sarabun", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

- ใช้ฟอนต์ **Sarabun** เป็นหลักเพื่อรองรับภาษาไทย
- รองรับ Responsive (Desktop first, แต่ใช้งานบน tablet ได้)

---

## 9. Phase 2 & 3 (Future)

### Phase 2 - Sales & Inventory (ยังไม่เริ่ม)
- Sales Orders (ใบสั่งขาย)
- Delivery Orders (ใบส่งของ)
- Invoices (ใบแจ้งหนี้)
- Inventory Management (คลังสินค้า)
- Stock In/Out
- Payment Tracking (ติดตามการชำระเงิน)
- Commission Calculation (คำนวณคอมมิชชัน)

### Phase 3 - Production & Reports (ยังไม่เริ่ม)
- Production Planning (วางแผนการผลิต)
- Production Orders (ใบสั่งผลิต)
- Bill of Materials (BOM)
- Payroll (ระบบเงินเดือน - OT calculation)
- Accounting (บัญชี)
- Dashboard & Reports
- Data Analytics

---

## 10. Development Guidelines

### 10.1 สำหรับ Claude Code

**ลำดับการพัฒนา Phase 1:**

1. **Setup Project** - สร้างโครงสร้างโปรเจค, ติดตั้ง dependencies
2. **Database** - สร้าง tables, run seeds (provinces, positions, etc.)
3. **Backend API** - สร้าง CRUD API ทีละ module
4. **Frontend** - สร้าง UI ทีละ module ตาม menu structure

**ลำดับการทำ Module (เรียงจากง่ายไปยาก):**

1. Genders (ง่ายสุด - แค่ CRUD)
2. Colors
3. Sizes
4. Versions
5. Product Categories
6. Production Methods
7. Brands (มี image upload)
8. Models (มี image upload + FK to brands)
9. Positions & Employment Types
10. Employees (ซับซ้อน - มี documents, images)
11. Provinces (seed data only - read only)
12. Regions (มี many-to-many กับ provinces)
13. Customers (มี FK to provinces, regions)
14. Discount Codes
15. Commission Rules
16. Products (ซับซ้อนสุด - มี FK ทุกตาราง + SKU auto-gen)

### 10.2 Naming Conventions

- **Database**: snake_case (employee_code, brand_id)
- **API Routes**: kebab-case (/production-methods, /discount-codes)
- **React Components**: PascalCase (EmployeeList, BrandForm)
- **JavaScript Variables**: camelCase (employeeCode, brandId)
- **Files**: kebab-case (employee-list.jsx, brand-form.jsx)

### 10.3 Error Handling

- Backend: ส่ง consistent error format `{ success: false, message: "...", errors: [] }`
- Frontend: แสดง MUI Snackbar สำหรับ success/error notifications
- Validation: ทำทั้ง frontend (form validation) และ backend (middleware)

### 10.4 File Upload Config

```javascript
// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // base upload directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Sub-directories:
// uploads/employees/profiles/
// uploads/employees/documents/
// uploads/brands/
// uploads/models/
// uploads/products/
```

---

> **หมายเหตุ**: เอกสารนี้เป็น reference สำหรับ Claude Code ในการพัฒนาระบบ ERP
> อัปเดตล่าสุด: มีนาคม 2026
