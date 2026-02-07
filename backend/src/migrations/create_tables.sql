-- ============================================
-- SUPABASE TABLES FOR QUANLYPHONGTRO
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS client_users CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROOMS TABLE
-- ============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_number SERIAL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied')),
  monthly_rent DECIMAL(12, 0) NOT NULL,
  due_date DATE,
  
  -- Tenant info (embedded)
  tenant_name VARCHAR(255),
  tenant_phone VARCHAR(50),
  tenant_identity_card VARCHAR(50),
  tenant_start_date DATE,
  tenant_end_date DATE,
  tenant_photo TEXT,
  tenant_identity_front_image TEXT,
  tenant_identity_back_image TEXT,
  
  -- Utilities info (embedded)
  electricity_used DECIMAL(10, 2) DEFAULT 0,
  electricity_rate DECIMAL(10, 0) DEFAULT 0,
  water_used DECIMAL(10, 2) DEFAULT 0,
  water_rate DECIMAL(10, 0) DEFAULT 0,
  utilities_month VARCHAR(10),
  
  -- Current payment info (embedded)
  payment_id UUID,
  payment_month VARCHAR(10),
  payment_rent DECIMAL(12, 0),
  payment_electricity DECIMAL(12, 0),
  payment_water DECIMAL(12, 0),
  payment_total DECIMAL(12, 0),
  payment_paid BOOLEAN DEFAULT FALSE,
  payment_paid_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLIENT_USERS TABLE
-- ============================================
CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50) UNIQUE NOT NULL,
  access_code VARCHAR(50) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PAYMENT_HISTORY TABLE
-- ============================================
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  room_name VARCHAR(255) NOT NULL,
  tenant_name VARCHAR(255),
  month VARCHAR(10) NOT NULL,
  rent DECIMAL(12, 0) NOT NULL,
  electricity DECIMAL(12, 0) DEFAULT 0,
  water DECIMAL(12, 0) DEFAULT 0,
  total DECIMAL(12, 0) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  electricity_used DECIMAL(10, 2),
  water_used DECIMAL(10, 2),
  electricity_rate DECIMAL(10, 0),
  water_rate DECIMAL(10, 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_rooms_room_number ON rooms(room_number);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_client_users_phone ON client_users(phone);
CREATE INDEX idx_client_users_room_id ON client_users(room_id);
CREATE INDEX idx_payment_history_room_id ON payment_history(room_id);
CREATE INDEX idx_payment_history_month ON payment_history(month);
CREATE INDEX idx_payment_history_paid ON payment_history(paid);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_users_updated_at BEFORE UPDATE ON client_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON payment_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT ADMIN (password: thanhtrung)
-- Password hash for 'thanhtrung' using bcrypt
-- ============================================
INSERT INTO admins (username, password, name, email, phone, address)
VALUES (
  'thanhnam',
  '$2a$12$A1O3G6axonAa3RSLqvIDQuZGq2SVEYWFWk03Ju0mzu4CpRccq1YZ.',
  'Bà Tuất',
  'batuat@example.com',
  '0123456789',
  'Hà Nội, Việt Nam'
)
ON CONFLICT (username) 
DO UPDATE SET 
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;
