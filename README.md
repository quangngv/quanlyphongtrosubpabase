# 🏠 Quản Lý Phòng Trọ Bà Tuất - Supabase Edition

Hệ thống quản lý phòng trọ hiện đại với Supabase cloud database. Bao gồm Admin Panel, Client Portal và Backend API.

## 🎯 Tính Năng

### Admin (Quản lý)
- ✅ Quản lý phòng trọ
- ✅ Quản lý người thuê
- ✅ Quản lý điện nước và thanh toán
- ✅ Thống kê doanh thu
- ✅ Tạo tài khoản khách thuê

### Client (Khách thuê)
- ✅ Tra cứu hợp đồng
- ✅ Xem hóa đơn điện nước
- ✅ Thanh toán trực tuyến
- ✅ Lịch sử thanh toán

## 🚀 Cài đặt nhanh

### Bước 1: Setup dependencies
```bash
setup.bat
```

### Bước 2: Tạo bảng trong Supabase
1. Vào https://yjqqfhlqksxhytbmnicr.supabase.co
2. Mở SQL Editor
3. Chạy script từ `backend/src/migrations/create_tables.sql`

### Bước 3: Seed dữ liệu mẫu
```bash
seed.bat
```

### Bước 4: Khởi động ứng dụng
```bash
start.bat
```

## 🔧 Yêu cầu

- Node.js >= 18.x
- npm hoặc yarn
- Tài khoản Supabase (đã có)

## 📁 Cấu trúc dự án

```
quanlyphongtrobatuat/
├── admin/      # Admin Panel (React + Vite + Supabase)
├── client/     # Client Portal (React + Vite + Supabase)  
├── backend/    # API Server (Express + Supabase)
├── start.bat   # Khởi động tất cả
├── setup.bat   # Cài đặt dependencies
├── stop.bat    # Dừng tất cả services
└── seed.bat    # Seed dữ liệu mẫu
```

## 🗃️ Database

**Supabase Cloud Database**
- URL: https://yjqqfhlqksxhytbmnicr.supabase.co
- Các bảng: admins, rooms, client_users, payment_history

## 🔐 Thông tin đăng nhập

### Admin (Quản lý)
- Username: `thanhnam`
- Password: `thanhtrung`
- URL: http://localhost:5173

### Client (Khách thuê)
- Số điện thoại và mã truy cập do admin cấp
- URL: http://localhost:5174

## 🌐 Services URLs

- **Backend API**: http://localhost:5000/api
- **Admin Panel**: http://localhost:5173
- **Client Portal**: http://localhost:5174
- **API Health**: http://localhost:5000/api/health

## 📝 Scripts

### Toàn bộ dự án
```bash
setup.bat   # Cài đặt tất cả dependencies
start.bat   # Khởi động tất cả services
stop.bat    # Dừng tất cả services
seed.bat    # Seed dữ liệu mẫu
```

### Backend
```bash
npm start          # Khởi động server
npm run dev        # Development với nodemon
npm run seed       # Seed dữ liệu
```

### Admin & Client
```bash
npm run dev        # Development server
npm run build      # Build production
npm run preview    # Preview production
```

## 🛠️ Troubleshooting

**Port đã sử dụng:**
```bash
stop.bat
```

**Lỗi kết nối Supabase:**
- Kiểm tra internet
- Xác nhận Supabase credentials trong .env
- Đảm bảo đã tạo bảng trong Supabase

**Không đăng nhập được:**
```bash
cd backend
npm run seed
```

## 📚 Tech Stack

- **Backend**: Express.js + Supabase
- **Frontend**: React 18 + Vite + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI**: Radix UI + Lucide Icons

## 📄 License

Private - © 2026 Nhà Trọ Bà Tuất

## Môi trường

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quanlyphongtro
JWT_SECRET=your-secret-key
```

### Admin & Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## Tính năng

### Admin
- Quản lý phòng trọ (CRUD)
- Quản lý người thuê
- Ghi điện nước
- Thanh toán hóa đơn
- Thống kê doanh thu
- Quản lý tài khoản khách hàng

### Client
- Đăng nhập bằng SĐT + Mã truy cập
- Xem thông tin hợp đồng
- Xem lịch sử thanh toán
- Xem thông tin điện nước

## License

MIT
# quanlyphongtrosubpabase
