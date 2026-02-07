import clientApiService from './apiService';

export type TenantProfile = {
  name: string;
  phone: string;
  accessCode: string;
  email: string;
  property: string;
  roomCode: string;
};

export type PaymentItem = {
  title: string;
  amount: number;
  status: "paid" | "due" | "overdue";
  date: string;
  note?: string;
};

export type UtilityCharge = {
  name: string;
  pricing: string;
  latestReading: string;
};

export type CurrentBill = {
  month: string;
  rent: number;
  electricity: number;
  water: number;
  total: number;
  paid: boolean;
  paidDate?: string;
};

export type LeaseRecord = {
  leaseCode: string;
  roomCode: string;
  propertyName: string;
  address: string;
  tenantName: string;
  phone: string;
  startedAt: string;
  nextDue: string;
  rent: number;
  deposit: number;
  utilities: UtilityCharge[];
  currentBill?: CurrentBill;
  payments: PaymentItem[];
  manager: {
    name: string;
    phone: string;
    zalo?: string;
    email?: string;
  };
  notes: string[];
};

export async function loginTenant(phone: string, code: string): Promise<TenantProfile> {
  try {
    // Try API first
    const response = await clientApiService.login(phone, code);
    if (response.success) {
      return {
        name: response.data.name,
        phone: response.data.phone,
        accessCode: response.data.accessCode,
        email: response.data.email,
        property: response.data.property,
        roomCode: response.data.roomCode,
      };
    }
  } catch (apiError) {
    console.log('API not available, falling back to localStorage');
  }

  // Fallback to localStorage (for offline mode or when API is down)
  try {
    const adminUsers = localStorage.getItem('qlpt_client_users_v1');
    if (adminUsers) {
      const users = JSON.parse(adminUsers);
      const user = users.find((u: any) => 
        u.phone === phone && 
        u.accessCode.trim().toUpperCase() === code.trim().toUpperCase() &&
        u.isActive === true
      );
      
      if (user) {
        const adminRooms = localStorage.getItem('qlpt_rooms_v1');
        let roomInfo = { property: 'Chưa gán phòng', roomCode: '-' };
        let tenantName = user.phone;
        
        if (adminRooms && user.roomId) {
          const rooms = JSON.parse(adminRooms);
          const room = rooms.find((r: any) => r.id === user.roomId);
          if (room) {
            roomInfo = {
              property: 'Nhà Trọ Bà Tuất',
              roomCode: room.name
            };
            if (room.tenant?.name) {
              tenantName = room.tenant.name;
            }
          }
        }
        
        return {
          name: tenantName,
          phone: user.phone,
          accessCode: user.accessCode,
          email: `${user.phone}@tenant.local`,
          property: roomInfo.property,
          roomCode: roomInfo.roomCode,
        };
      }
    }
  } catch (error) {
    console.error('Error checking localStorage:', error);
  }
  
  throw new Error("Sai số điện thoại hoặc mã truy cập");
}

export async function lookupLease(leaseCode: string, phone: string): Promise<LeaseRecord | null> {
  try {
    // Try API first
    const response = await clientApiService.getLease(phone, leaseCode);
    if (response.success) {
      const data = response.data;
      return {
        leaseCode: data.leaseCode,
        roomCode: data.roomCode,
        propertyName: data.propertyName,
        address: data.address,
        tenantName: data.tenantName,
        phone: data.phone,
        startedAt: data.startedAt,
        nextDue: data.nextDue,
        rent: data.rent,
        deposit: data.deposit,
        utilities: data.utilities || [],
        currentBill: data.currentBill || null,
        payments: data.payments || [],
        manager: data.manager,
        notes: data.notes || [],
      };
    }
  } catch (apiError) {
    console.log('API not available, falling back to localStorage');
  }

  // Fallback to localStorage (for offline mode or when API is down)
  try {
    const adminUsers = localStorage.getItem('qlpt_client_users_v1');
    const adminRooms = localStorage.getItem('qlpt_rooms_v1');
    
    if (adminUsers && adminRooms) {
      const users = JSON.parse(adminUsers);
      const rooms = JSON.parse(adminRooms);
      
      const user = users.find((u: any) => 
        (u.accessCode.trim().toUpperCase() === leaseCode.trim().toUpperCase() ||
         (u.roomId && rooms.find((r: any) => r.id === u.roomId)?.name.toUpperCase() === leaseCode.toUpperCase())) &&
        u.phone === phone.trim() &&
        u.isActive === true
      );
      
      if (user && user.roomId) {
        const room = rooms.find((r: any) => r.id === user.roomId);
        if (room && room.tenant) {
          return {
            leaseCode: user.accessCode,
            roomCode: room.name,
            propertyName: 'Nhà Trọ Bà Tuất',
            address: '123 Đường ABC, Quận XYZ, TP.HCM',
            tenantName: room.tenant.name,
            phone: room.tenant.phone,
            startedAt: room.tenant.startDate,
            nextDue: room.dueDate || '2025-12-05',
            rent: room.monthlyRent,
            deposit: 5000000,
            utilities: room.utilities ? [
              { name: 'Điện', pricing: `${room.utilities.electricityRate.toLocaleString('vi-VN')} VND/kWh`, latestReading: `${room.utilities.electricityUsed} kWh` },
              { name: 'Nước', pricing: `${room.utilities.waterRate.toLocaleString('vi-VN')} VND/m³`, latestReading: `${room.utilities.waterUsed} m³` },
            ] : [],
            currentBill: room.utilities ? {
              month: room.utilities.month,
              rent: room.monthlyRent,
              electricity: room.utilities.electricityUsed * room.utilities.electricityRate,
              water: room.utilities.waterUsed * room.utilities.waterRate,
              total: room.monthlyRent + (room.utilities.electricityUsed * room.utilities.electricityRate) + (room.utilities.waterUsed * room.utilities.waterRate),
              paid: room.payment?.paid || false,
              paidDate: room.payment?.paidDate
            } : undefined,
            payments: room.payment ? [
              { 
                title: `Tiền phòng ${room.payment.month}`, 
                amount: room.payment.total, 
                status: room.payment.paid ? 'paid' : 'due', 
                date: room.payment.paidDate || room.dueDate || '2025-12-05',
                note: room.payment.paid ? 'Đã thanh toán' : 'Đến hạn thanh toán'
              }
            ] : [],
            manager: {
              name: 'Quản lý',
              phone: '0838 000 222',
              zalo: 'zalo.me/quanlyphong',
              email: 'quanly@batuat.vn',
            },
            notes: [
              'Gửi thông tin thanh toán trước ngày 05 mỗi tháng.',
              'Báo sự cố thiết bị qua Zalo trước khi gọi kỹ thuật.',
            ],
          };
        }
      }
    }
  } catch (error) {
    console.error('Error looking up localStorage:', error);
  }
  
  return null;
}

// Pay bill function
export async function payBill(phone: string, accessCode: string): Promise<boolean> {
  try {
    const response = await clientApiService.payBill(phone, accessCode);
    return response.success;
  } catch (error: any) {
    console.error('Payment error:', error);
    throw new Error(error.message || 'Thanh toán thất bại');
  }
}
