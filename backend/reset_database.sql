-- ============================================================
-- CA FIRM MANAGEMENT SYSTEM - COMPLETE DATABASE RESET
-- ============================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS ca_firm_db;
CREATE DATABASE ca_firm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ca_firm_db;

-- ============================================================
-- 1. USERS TABLE (Authentication only)
-- ============================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'CA', 'STAFF', 'CLIENT') NOT NULL DEFAULT 'CA',
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

-- ============================================================
-- 2. CA MASTERS TABLE (CA specific data)
-- ============================================================
CREATE TABLE ca_masters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    firm_name VARCHAR(255),
    firm_address TEXT,
    gst_number VARCHAR(50),
    pan_number VARCHAR(20),
    specialization VARCHAR(100),
    experience INT,
    registration_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ca_masters_user_id (user_id)
);

-- ============================================================
-- 3. CLIENT MASTERS TABLE (Client specific data)
-- ============================================================
CREATE TABLE client_masters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    ca_user_id INT NOT NULL,
    client_type ENUM('INDIVIDUAL', 'BUSINESS', 'HUF', 'PARTNERSHIP', 'COMPANY', 'LLP') DEFAULT 'INDIVIDUAL',
    pan_number VARCHAR(20),
    aadhaar_number VARCHAR(20),
    address TEXT,
    business_name VARCHAR(255),
    gst_number VARCHAR(50),
    dob DATETIME,
    status ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED') DEFAULT 'PENDING',
    is_verified BOOLEAN DEFAULT FALSE,
    total_fee DECIMAL(10,2) DEFAULT 0.00,
    paid_fee DECIMAL(10,2) DEFAULT 0.00,
    pending_fee DECIMAL(10,2) DEFAULT 0.00,
    fee_status ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE') DEFAULT 'PENDING',
    fee_confirmed BOOLEAN DEFAULT FALSE,
    fee_confirmed_at DATETIME,
    documents_required JSON,
    documents_uploaded JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ca_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_client_masters_user_id (user_id),
    INDEX idx_client_masters_ca_user_id (ca_user_id)
);

-- ============================================================
-- 4. FINANCIAL YEARS TABLE
-- ============================================================
CREATE TABLE fy_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    year VARCHAR(10) UNIQUE NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fy_master_year (year)
);

-- ============================================================
-- 5. DOCUMENTS TABLE
-- ============================================================
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    fy_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_size INT,
    file_type VARCHAR(50),
    status ENUM('PENDING_UPLOAD', 'UPLOADED', 'APPROVED', 'REJECTED', 'RE_UPLOAD_REQUIRED') DEFAULT 'PENDING_UPLOAD',
    gdrive_file_id VARCHAR(255),
    gdrive_web_link VARCHAR(500),
    local_path VARCHAR(500),
    remarks TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(50) DEFAULT 'client',
    fee_confirmed BOOLEAN DEFAULT FALSE,
    fee_confirmed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES client_masters(id) ON DELETE CASCADE,
    FOREIGN KEY (fy_id) REFERENCES fy_master(id) ON DELETE CASCADE,
    INDEX idx_documents_client_id (client_id),
    INDEX idx_documents_status (status)
);

-- ============================================================
-- 6. FEE CATEGORIES TABLE
-- ============================================================
CREATE TABLE fee_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    base_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    keywords JSON,
    fee_type VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT TRUE,
    is_system_default BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_fee_categories_user_id (user_id),
    INDEX idx_fee_categories_code (code)
);

-- ============================================================
-- 7. CLIENT FEE MATCHES TABLE
-- ============================================================
CREATE TABLE client_fee_matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    fee_category_id INT NOT NULL,
    document_id INT,
    fee_amount DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    matched_keywords JSON,
    match_confidence DECIMAL(5,2) DEFAULT 0.00,
    is_auto_matched BOOLEAN DEFAULT TRUE,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client_masters(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_client_fee_matches_client_id (client_id),
    INDEX idx_client_fee_matches_applied (is_applied)
);

-- ============================================================
-- 8. PUBLISHED FEE PAMPHLET TABLE
-- ============================================================
CREATE TABLE published_fee_pamphlet (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    fee_data JSON NOT NULL,
    total_fee DECIMAL(10,2) DEFAULT 0.00,
    total_gst DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    is_viewed BOOLEAN DEFAULT FALSE,
    viewed_at DATETIME,
    accepted_at DATETIME,
    rejected_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES client_masters(id) ON DELETE CASCADE,
    INDEX idx_published_fee_pamphlet_client_id (client_id),
    INDEX idx_published_fee_pamphlet_user_id (user_id)
);

-- ============================================================
-- 9. BILLS TABLE
-- ============================================================
CREATE TABLE bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    user_id INT NOT NULL,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'PAID', 'CANCELLED') DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    gst_amount DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    accepted_at DATETIME,
    rejected_at DATETIME,
    paid_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client_masters(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bills_client_id (client_id),
    INDEX idx_bills_user_id (user_id),
    INDEX idx_bills_bill_number (bill_number)
);

-- ============================================================
-- 10. BILL ITEMS TABLE
-- ============================================================
CREATE TABLE bill_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    fee_category_id INT,
    document_id INT,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_bill_items_bill_id (bill_id)
);

-- ============================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read)
);

-- ============================================================
-- 12. INSERT INITIAL DATA
-- ============================================================

-- 12.1 Super Admin (with EXPLICIT role)
INSERT INTO users (
    username, 
    name, 
    email, 
    hashed_password, 
    role, 
    is_super_admin, 
    is_active, 
    is_verified, 
    created_at, 
    updated_at
) VALUES (
    'admin', 
    'Super Admin', 
    'admin@cafirm.com', 
    '$2b$12$vU/ukisnyKbK0Qqz9LO6vugO3nfi5oL1sYc8.SlurHtiQNNMgkLhq',
    'SUPER_ADMIN',  -- Explicit role value
    1, 
    1, 
    1, 
    NOW(), 
    NOW()
);

-- 12.2 CA User (with EXPLICIT role)
INSERT INTO users (
    username, 
    name, 
    email, 
    hashed_password, 
    role, 
    is_super_admin, 
    is_active, 
    is_verified, 
    phone, 
    created_at, 
    updated_at
) VALUES (
    'ca_test', 
    'CA Test', 
    'ca@example.com', 
    '$2b$12$8zv52xRup.4Tz7RLIC09su3fHeNhMemIrhreHyNxR7kPJrCcpvqG2',
    'CA',  -- Explicit role value
    0, 
    1, 
    1, 
    '9876543210', 
    NOW(), 
    NOW()
);

SET @ca_user_id = LAST_INSERT_ID();

-- 12.3 CA Master
INSERT INTO ca_masters (
    user_id, 
    firm_name, 
    firm_address, 
    gst_number, 
    pan_number, 
    specialization, 
    experience, 
    created_at, 
    updated_at
) VALUES (
    @ca_user_id, 
    'IT FIRM', 
    '35 b Pratap Ganj Peth Satara', 
    '27BKTPR4821L1Z8', 
    'QWEXS7319F', 
    'All Services', 
    5, 
    NOW(), 
    NOW()
);

-- 12.4 Client User (with EXPLICIT role)
INSERT INTO users (
    username, 
    name, 
    email, 
    hashed_password, 
    role, 
    is_super_admin, 
    is_active, 
    is_verified, 
    created_at, 
    updated_at
) VALUES (
    'client_test', 
    'Jay Patil', 
    'impatiljay@gmail.com', 
    '$2b$12$8KILI/dxzdYozeH3.XN5y.OYF3dSJlUFeA.rZrj/ytM7Kj7/fFOAu',
    'CLIENT',  -- Explicit role value
    0, 
    1, 
    1, 
    NOW(), 
    NOW()
);

SET @client_user_id = LAST_INSERT_ID();

-- 12.5 Client Master
INSERT INTO client_masters (
    user_id, 
    ca_user_id, 
    client_type, 
    pan_number, 
    aadhaar_number, 
    address, 
    business_name, 
    gst_number, 
    dob, 
    status, 
    created_at, 
    updated_at
) VALUES (
    @client_user_id, 
    @ca_user_id, 
    'INDIVIDUAL', 
    'HJPLM6284N', 
    '914728365041',
    'Pune', 
    'KIRANA STORE', 
    '29QWEXS7319F1Z5', 
    '2002-06-17 00:00:00',
    'ACTIVE', 
    NOW(), 
    NOW()
);

-- 12.6 Financial Years
INSERT INTO fy_master (year, status, created_at, updated_at) VALUES 
('2023-24', 1, NOW(), NOW()),
('2024-25', 1, NOW(), NOW()),
('2025-26', 1, NOW(), NOW()),
('2026-27', 1, NOW(), NOW());

-- 12.7 Default Fee Categories for CA
INSERT INTO fee_categories (
    user_id, 
    name, 
    code, 
    description, 
    base_fee, 
    gst_rate, 
    keywords, 
    fee_type, 
    is_active, 
    is_system_default, 
    is_published, 
    created_at, 
    updated_at
) VALUES 
(@ca_user_id, 'Basic ITR - Salary/House Property/Other Sources', 'BASIC_ITR', 
 'Basic ITR filing for salary, house property (≤2), and other sources', 
 500.00, 18.00, '["salary","house property","other sources","it returns","form 16"]', 
 'basic', 1, 1, 0, NOW(), NOW()),
(@ca_user_id, 'Additional House Property (beyond 2)', 'HOUSE_PROPERTY_EXTRA', 
 'Additional fee for each house property beyond 2', 
 100.00, 18.00, '["house property 3","third house","property income","house 3"]', 
 'basic', 1, 1, 0, NOW(), NOW()),
(@ca_user_id, 'Capital Gains - Immovable Property', 'CAPITAL_GAINS_IMMOVABLE', 
 'Capital gains from immovable property (land, building, etc.)', 
 200.00, 18.00, '["capital gains","immovable","property sale","land sale","building sale"]', 
 'capital_gains', 1, 1, 0, NOW(), NOW()),
(@ca_user_id, 'Capital Gains - Equity/Debt/Mutual Funds', 'CAPITAL_GAINS_EQUITY', 
 'Capital gains from equity, debt securities, and mutual funds', 
 300.00, 18.00, '["equity","debt","mutual fund","share","stock","securities"]', 
 'capital_gains', 1, 1, 0, NOW(), NOW()),
(@ca_user_id, 'Capital Gains - Other (F&O, etc.)', 'CAPITAL_GAINS_OTHER', 
 'Capital gains from futures and options trading', 
 300.00, 18.00, '["f&o","futures","options","derivatives","trading"]', 
 'capital_gains', 1, 1, 0, NOW(), NOW()),
(@ca_user_id, 'Business Income - Without Accounts', 'BUSINESS_NO_ACCOUNTS', 
 'Business income without financial statements and accounts', 
 500.00, 18.00, '["business income","presumptive","no accounts"]', 
 'business', 1, 1, 0, NOW(), NOW()),
(@ca_user_id, 'Business Income - With Accounts & Financials', 'BUSINESS_WITH_ACCOUNTS', 
 'Business income with financial statements and accounts', 
 700.00, 18.00, '["business income","accounts","financials","audited","balance sheet"]', 
 'business', 1, 1, 0, NOW(), NOW()),
(@ca_user_id, 'Non-Resident Indian (NRI)', 'NRI', 
 'Filing for Non-Resident Indians', 
 500.00, 18.00, '["nri","non resident","foreign income","overseas"]', 
 'nri', 1, 1, 0, NOW(), NOW()),
(@ca_user_id, 'Resident with Foreign Income', 'FOREIGN_INCOME', 
 'Resident with foreign income (DTAA/FTC/Form 67)', 
 750.00, 18.00, '["foreign income","dtaa","ftc","form 67","double taxation"]', 
 'foreign_income', 1, 1, 0, NOW(), NOW());

-- ============================================================
-- 13. VERIFY DATA
-- ============================================================
SELECT 'USERS' as TableName, COUNT(*) as TotalCount FROM users
UNION ALL
SELECT 'CA MASTERS', COUNT(*) FROM ca_masters
UNION ALL
SELECT 'CLIENT MASTERS', COUNT(*) FROM client_masters
UNION ALL
SELECT 'FY MASTER', COUNT(*) FROM fy_master
UNION ALL
SELECT 'FEE CATEGORIES', COUNT(*) FROM fee_categories;

-- Show all users with roles
SELECT id, username, name, email, role, is_super_admin, is_active 
FROM users 
ORDER BY id;

-- Show CA with firm details
SELECT u.id, u.name, u.email, c.firm_name, c.specialization 
FROM users u
JOIN ca_masters c ON u.id = c.user_id
WHERE u.role = 'CA';

-- Show Clients with their CA
SELECT 
    u.id AS client_id,
    u.name AS client_name,
    u.email AS client_email,
    ca.name AS ca_name,
    cm.business_name,
    cm.status
FROM users u
JOIN client_masters cm ON u.id = cm.user_id
JOIN users ca ON cm.ca_user_id = ca.id
WHERE u.role = 'CLIENT';