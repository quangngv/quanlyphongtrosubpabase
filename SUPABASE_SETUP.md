# Hướng dẫn thiết lập Supabase

## 1. Thông tin kết nối Supabase

```

```

## 2. Tạo các bảng trong Supabase

Truy cập vào Supabase Dashboard > SQL Editor và chạy nội dung file `backend/src/migrations/create_tables.sql`.

Hoặc chạy các lệnh SQL sau:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ADMINS TABLE
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

-- ROOMS TABLE
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_number SERIAL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied')),
  monthly_rent DECIMAL(12, 0) NOT NULL,
  due_date DATE,
  
  -- Tenant info
  tenant_name VARCHAR(255),
  tenant_phone VARCHAR(50),
  tenant_identity_card VARCHAR(50),
  tenant_start_date DATE,
  tenant_end_date DATE,
  tenant_photo TEXT,
  tenant_identity_front_image TEXT,
  tenant_identity_back_image TEXT,
  
  -- Utilities info
  electricity_used DECIMAL(10, 2) DEFAULT 0,
  electricity_rate DECIMAL(10, 0) DEFAULT 0,
  water_used DECIMAL(10, 2) DEFAULT 0,
  water_rate DECIMAL(10, 0) DEFAULT 0,
  utilities_month VARCHAR(10),
  
  -- Payment info
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

-- CLIENT_USERS TABLE
CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50) UNIQUE NOT NULL,
  access_code VARCHAR(50) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAYMENT_HISTORY TABLE
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

-- INDEXES
CREATE INDEX idx_rooms_room_number ON rooms(room_number);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_client_users_phone ON client_users(phone);
CREATE INDEX idx_client_users_room_id ON client_users(room_id);
CREATE INDEX idx_payment_history_room_id ON payment_history(room_id);
CREATE INDEX idx_payment_history_month ON payment_history(month);
CREATE INDEX idx_payment_history_paid ON payment_history(paid);
```

## 3. Chạy Seed Data (Tùy chọn)

```bash
cd backend
npm run seed
```

## 4. Cấu trúc dữ liệu

### Bảng `admins`
- Lưu thông tin admin/quản lý
- Mật khẩu được hash bằng bcrypt

### Bảng `rooms`
- Lưu thông tin phòng
- Thông tin người thuê được nhúng trực tiếp (tenant_*)
- Thông tin điện nước được nhúng (electricity_*, water_*, utilities_month)
- Thông tin thanh toán hiện tại được nhúng (payment_*)

### Bảng `client_users`
- Lưu thông tin tài khoản khách thuê
- Liên kết với bảng rooms qua `room_id`

### Bảng `payment_history`
- Lưu lịch sử thanh toán
- Liên kết với bảng rooms qua `room_id`

## 5. API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập admin
- `GET /api/auth/me` - Lấy thông tin admin hiện tại
- `PUT /api/auth/profile` - Cập nhật profile
- `PUT /api/auth/change-password` - Đổi mật khẩu

### Rooms
- `GET /api/rooms` - Lấy danh sách phòng
- `GET /api/rooms/:id` - Lấy chi tiết phòng
- `POST /api/rooms` - Tạo phòng mới
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng
- `POST /api/rooms/:id/tenant` - Thêm/cập nhật người thuê
- `DELETE /api/rooms/:id/tenant` - Xóa người thuê
- `PUT /api/rooms/:id/utilities` - Cập nhật điện nước
- `POST /api/rooms/:id/pay` - Thanh toán

### Users
- `GET /api/users` - Lấy danh sách người dùng
- `POST /api/users` - Tạo người dùng mới
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng

### Payments
- `GET /api/payments` - Lấy lịch sử thanh toán
- `GET /api/payments/statistics` - Lấy thống kê
- `GET /api/payments/revenue` - Lấy doanh thu theo tháng

### Client
- `POST /api/client/login` - Đăng nhập khách
- `POST /api/client/lease` - Lấy thông tin thuê
- `POST /api/client/pay` - Thanh toán hóa đơn

## 6. Chạy ứng dụng

```bash
# Backend
cd backend
npm run dev

# Admin Panel
cd admin
npm run dev

# Client App
cd client
npm run dev
```
