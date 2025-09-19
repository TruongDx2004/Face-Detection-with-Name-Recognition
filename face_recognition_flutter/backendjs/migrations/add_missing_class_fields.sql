-- Migration to add missing fields to classes table
-- Run this migration to add code, year fields to the classes table

-- Check if columns exist before adding them
SET @col_exists = 0;
SELECT count(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = database() 
AND table_name = 'classes' 
AND column_name = 'code';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE classes ADD COLUMN code VARCHAR(50) UNIQUE AFTER name', 
    'SELECT "Column code already exists" as msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add year column if it doesn't exist
SET @col_exists = 0;
SELECT count(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = database() 
AND table_name = 'classes' 
AND column_name = 'year';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE classes ADD COLUMN year VARCHAR(4) DEFAULT "2024" AFTER code', 
    'SELECT "Column year already exists" as msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if status column exists, if not add it
SET @col_exists = 0;
SELECT count(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = database() 
AND table_name = 'classes' 
AND column_name = 'status';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE classes ADD COLUMN status ENUM("active", "inactive") DEFAULT "active" AFTER description', 
    'SELECT "Column status already exists" as msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to have default values
UPDATE classes SET 
    code = CONCAT('CLS', LPAD(id, 3, '0')),
    year = '2024',
    status = 'active'
WHERE code IS NULL OR year IS NULL OR status IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_year ON classes(year);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);