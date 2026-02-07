# Backend - Quản Lý Phòng Trọ

Backend API cho hệ thống quản lý phòng trọ Bà Tuất.

## Yêu cầu

- Node.js >= 18.x
- MongoDB >= 6.x (chạy local hoặc MongoDB Atlas)

## Cài đặt

```bash
cd backend
npm install
```

## Cấu hình

1. Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Cập nhật các biến môi trường trong `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quanlyphongtro
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_USERNAME=thanhnam
ADMIN_PASSWORD=thanhtrung
```

## Chạy MongoDB

### Option 1: MongoDB Local
```bash
# Windows - chạy MongoDB service
mongod

# Hoặc với Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option 2: MongoDB Atlas
- Tạo cluster miễn phí tại https://www.mongodb.com/cloud/atlas
- Cập nhật MONGODB_URI trong `.env`

## Chạy Server

### Development (với auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

## Khởi tạo dữ liệu mẫu

```bash
npm run seed
```

Lệnh này sẽ tạo:
- 1 Admin mặc định (thanhnam / thanhtrung)
- 3 Phòng mẫu
- 2 Tài khoản khách hàng

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập admin
- `GET /api/auth/me` - Lấy thông tin admin hiện tại
- `PUT /api/auth/profile` - Cập nhật thông tin cá nhân
- `PUT /api/auth/change-password` - Đổi mật khẩu
- `POST /api/auth/logout` - Đăng xuất

### Rooms
- `GET /api/rooms` - Lấy danh sách phòng
- `GET /api/rooms/:id` - Lấy thông tin phòng
- `POST /api/rooms` - Tạo phòng mới
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng
- `POST /api/rooms/:id/tenant` - Thêm/cập nhật người thuê
- `DELETE /api/rooms/:id/tenant` - Xóa người thuê
- `PUT /api/rooms/:id/utilities` - Cập nhật điện nước
- `POST /api/rooms/:id/pay` - Thanh toán hóa đơn

### Tenants
- `GET /api/tenants` - Lấy danh sách người thuê

### Client Users
- `GET /api/users` - Lấy danh sách tài khoản khách
- `POST /api/users` - Tạo tài khoản khách
- `PUT /api/users/:id` - Cập nhật tài khoản
- `DELETE /api/users/:id` - Xóa tài khoản

### Payments
- `GET /api/payments` - Lịch sử thanh toán
- `GET /api/payments/statistics` - Thống kê tổng quan
- `GET /api/payments/revenue` - Doanh thu theo tháng

### Client (Người thuê)
- `POST /api/client/login` - Đăng nhập khách
- `POST /api/client/lease` - Xem thông tin hợp đồng

### Health Check
- `GET /api/health` - Kiểm tra trạng thái server

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── server.js          # Entry point
│   ├── seed.js            # Script khởi tạo dữ liệu
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   ├── models/
│   │   ├── Admin.js       # Model Admin
│   │   ├── Room.js        # Model Phòng
│   │   ├── ClientUser.js  # Model Tài khoản khách
│   │   └── PaymentHistory.js
│   └── routes/
│       ├── auth.js        # Routes xác thực
│       ├── rooms.js       # Routes phòng
│       ├── tenants.js     # Routes người thuê
│       ├── users.js       # Routes tài khoản khách
│       ├── payments.js    # Routes thanh toán
│       └── client.js      # Routes cho app khách
├── .env
├── .env.example
├── package.json
└── README.md
```

## Test credentials

**Admin:**
- Username: `thanhnam`
- Password: `thanhtrung`

**Client 1:**
- Phone: `0987654321`
- Access Code: `ABC123`

**Client 2:**
- Phone: `0912345678`
- Access Code: `XYZ789`
