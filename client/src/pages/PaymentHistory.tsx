import { useEffect, useState, useMemo } from "react";
import { CalendarClock, CheckCircle2, XCircle, Clock, DollarSign, FileText, Search, Calendar } from "lucide-react";
import { lookupLease, type LeaseRecord, type PaymentItem } from "@/api/mockData";
import { useAuth } from "@/context/AuthContext";
import { StatusPill } from "@/components/StatusPill";
import { PaymentGateway } from "@/components/PaymentGateway";
import { clientApiService } from "@/api/apiService";

const money = (value: number) =>
  value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

// Helper to parse month/year from payment title or date
const parseMonthYear = (payment: PaymentItem): { month: number; year: number } | null => {
  // Try to parse from title first (format: "Tháng 01/2026")
  const titleMatch = payment.title.match(/(\d{2})\/(\d{4})/);
  if (titleMatch) {
    return { month: parseInt(titleMatch[1]), year: parseInt(titleMatch[2]) };
  }
  
  // Try to parse from date (format: "15/01/2026")
  const dateMatch = payment.date.match(/\d{2}\/(\d{2})\/(\d{4})/);
  if (dateMatch) {
    return { month: parseInt(dateMatch[1]), year: parseInt(dateMatch[2]) };
  }
  
  return null;
};

export function PaymentHistory() {
  const { user } = useAuth();
  const [record, setRecord] = useState<LeaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "all" or "MM/YYYY"
  const [fromMonth, setFromMonth] = useState<string>(""); // "YYYY-MM"
  const [toMonth, setToMonth] = useState<string>(""); // "YYYY-MM"
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.phone || !user?.accessCode) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await lookupLease(user.accessCode, user.phone);
        setRecord(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handlePaymentSuccess = async () => {
    if (!user?.phone || !user?.accessCode) {
      throw new Error('Không có thông tin đăng nhập');
    }
    
    try {
      setPaying(true);
      
      // Gọi API thanh toán
      await clientApiService.payBill(user.phone, user.accessCode);
      
      // Reload data sau khi thanh toán thành công
      const result = await lookupLease(user.accessCode, user.phone);
      setRecord(result);
      
      // Thanh toán thành công - không throw error
    } catch (error: any) {
      console.error('Payment error:', error);
      // Hiển thị lỗi và throw để PaymentGateway biết
      const errorMessage = error.message || 'Có lỗi xảy ra khi thanh toán';
      alert(errorMessage);
      throw error;
    } finally {
      setPaying(false);
    }
  };

  // Move all useMemo hooks BEFORE any early returns
  const payments = record?.payments || [];
  
  // Get unique months for dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    payments.forEach(p => {
      const parsed = parseMonthYear(p);
      if (parsed) {
        months.add(`${String(parsed.month).padStart(2, '0')}/${parsed.year}`);
      }
    });
    return Array.from(months).sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number);
      const [mb, yb] = b.split('/').map(Number);
      return ya !== yb ? yb - ya : mb - ma; // Sort descending
    });
  }, [payments]);
  
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Filter by payment status
      if (filter === "paid" && p.status !== "paid") return false;
      if (filter === "unpaid" && p.status === "paid") return false;
      
      const parsed = parseMonthYear(p);
      if (!parsed) return true; // If can't parse, include it
      
      // Filter by specific month
      if (selectedMonth !== "all") {
        const [selMonth, selYear] = selectedMonth.split('/').map(Number);
        if (parsed.month !== selMonth || parsed.year !== selYear) return false;
      }
      
      // Filter by date range
      if (fromMonth || toMonth) {
        const paymentDate = new Date(parsed.year, parsed.month - 1, 1);
        
        if (fromMonth) {
          const [fromYear, fromM] = fromMonth.split('-').map(Number);
          const fromDate = new Date(fromYear, fromM - 1, 1);
          if (paymentDate < fromDate) return false;
        }
        
        if (toMonth) {
          const [toYear, toM] = toMonth.split('-').map(Number);
          const toDate = new Date(toYear, toM - 1, 1);
          if (paymentDate > toDate) return false;
        }
      }
      
      return true;
    });
  }, [payments, filter, selectedMonth, fromMonth, toMonth]);

  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalUnpaid = payments.filter(p => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0);

  // NOW safe to have early returns after all hooks
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ color: "var(--muted)" }}>Đang tải lịch sử thanh toán...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ color: "var(--muted)" }}>Không có dữ liệu thanh toán</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <section className="card hero-sheen" style={{ padding: 22 }}>
        <div className="pill" style={{ background: "rgba(109, 167, 255, 0.14)", marginBottom: 12 }}>
          <CalendarClock size={18} color="var(--accent-2)" /> Lịch sử thanh toán
        </div>
        <h2 style={{ margin: 0 }}>Quản lý hóa đơn</h2>
        <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>
          Phòng {record.roomCode} - {record.propertyName}
        </p>
      </section>

      {/* Summary Cards */}
      <div className="grid-auto" style={{ gap: 16 }}>
        <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(108, 242, 194, 0.1) 0%, rgba(108, 242, 194, 0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <CheckCircle2 size={20} color="var(--accent)" />
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Đã thanh toán</div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{money(totalPaid)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {payments.filter(p => p.status === "paid").length} hóa đơn
          </div>
        </div>

        <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Clock size={20} color="#ff6b6b" />
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Chưa thanh toán</div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#ff6b6b' }}>{money(totalUnpaid)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {payments.filter(p => p.status !== "paid").length} hóa đơn
          </div>
        </div>

        <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(109, 167, 255, 0.1) 0%, rgba(109, 167, 255, 0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <FileText size={20} color="var(--accent-2)" />
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Tổng hóa đơn</div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-2)' }}>{money(totalPaid + totalUnpaid)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {payments.length} hóa đơn tổng cộng
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter("all")}
            className={filter === "all" ? "button-primary" : "button-secondary"}
            style={{ padding: "8px 16px", fontSize: 14 }}
          >
            Tất cả ({payments.length})
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={filter === "paid" ? "button-primary" : "button-secondary"}
            style={{ padding: "8px 16px", fontSize: 14 }}
          >
            Đã thanh toán ({payments.filter(p => p.status === "paid").length})
          </button>
          <button
            onClick={() => setFilter("unpaid")}
            className={filter === "unpaid" ? "button-primary" : "button-secondary"}
            style={{ padding: "8px 16px", fontSize: 14 }}
          >
            Chưa thanh toán ({payments.filter(p => p.status !== "paid").length})
          </button>
        </div>

        {/* Month Filters */}
        <div className="fade-border" style={{ padding: 18, marginBottom: 20, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Search size={18} color="var(--accent)" />
            <div style={{ fontWeight: 700, fontSize: 15 }}>Tìm kiếm theo tháng</div>
          </div>
          
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Single month selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
                Chọn tháng cụ thể
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  // Clear date range when selecting specific month
                  if (e.target.value !== "all") {
                    setFromMonth("");
                    setToMonth("");
                  }
                }}
                className="input"
                style={{ padding: '10px 12px', fontSize: 14, cursor: 'pointer' }}
              >
                <option value="all">Tất cả các tháng</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>Tháng {month}</option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Calendar size={16} color="var(--accent-2)" />
                <label style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Hoặc chọn khoảng thời gian
                </label>
              </div>
              <div className="grid-auto" style={{ gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                    Từ tháng
                  </label>
                  <input
                    type="month"
                    value={fromMonth}
                    onChange={(e) => {
                      setFromMonth(e.target.value);
                      // Clear single month selector when using date range
                      if (e.target.value) setSelectedMonth("all");
                    }}
                    className="input"
                    style={{ padding: '10px 12px', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                    Đến tháng
                  </label>
                  <input
                    type="month"
                    value={toMonth}
                    onChange={(e) => {
                      setToMonth(e.target.value);
                      // Clear single month selector when using date range
                      if (e.target.value) setSelectedMonth("all");
                    }}
                    className="input"
                    style={{ padding: '10px 12px', fontSize: 14 }}
                  />
                </div>
              </div>
              {(fromMonth || toMonth) && (
                <button
                  onClick={() => {
                    setFromMonth("");
                    setToMonth("");
                  }}
                  className="button-secondary"
                  style={{ marginTop: 12, padding: '8px 14px', fontSize: 13 }}
                >
                  Xóa khoảng thời gian
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(109, 167, 255, 0.1)', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            Hiển thị <span style={{ fontWeight: 700, color: 'var(--accent-2)' }}>{filteredPayments.length}</span> hóa đơn
            {selectedMonth !== "all" && ` - Tháng ${selectedMonth}`}
            {(fromMonth || toMonth) && ` - ${fromMonth ? `Từ ${fromMonth}` : ''} ${toMonth ? `đến ${toMonth}` : ''}`}
          </div>
        </div>

        {/* Payment List */}
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment, index) => {
              // Get electricity and water costs from currentBill if this is the current month
              let electricityAmount = 0;
              let waterAmount = 0;
              const rentAmount = record.rent || 0;
              
              // Check if this payment matches the currentBill month
              if (record.currentBill) {
                const paymentMonth = payment.title.match(/\d{2}\/\d{4}/)?.[0];
                const currentBillMonth = record.currentBill.month;
                
                if (paymentMonth === currentBillMonth || payment.title.includes(currentBillMonth)) {
                  electricityAmount = record.currentBill.electricity;
                  waterAmount = record.currentBill.water;
                }
              }
              
              // Fallback: try to parse from note if available
              if (electricityAmount === 0 && waterAmount === 0 && payment.note) {
                const electricityMatch = payment.note.match(/Điện:\s*([\d,\.]+)/);
                const waterMatch = payment.note.match(/Nước:\s*([\d,\.]+)/);
                if (electricityMatch) electricityAmount = parseInt(electricityMatch[1].replace(/[,\.]/g, ''));
                if (waterMatch) waterAmount = parseInt(waterMatch[1].replace(/[,\.]/g, ''));
              }

              return (
                <div
                  key={payment.title || index}
                  className="fade-border"
                  style={{
                    padding: 18,
                    background: payment.status === "paid" 
                      ? "rgba(108, 242, 194, 0.03)" 
                      : "rgba(255, 107, 107, 0.03)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {payment.status === "paid" ? (
                        <CheckCircle2 size={24} color="var(--accent)" />
                      ) : payment.status === "overdue" ? (
                        <XCircle size={24} color="#ff6b6b" />
                      ) : (
                        <Clock size={24} color="#ffa500" />
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{payment.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                          {payment.date}
                        </div>
                      </div>
                    </div>
                    <StatusPill status={payment.status || 'due'}>
                      {payment.status === 'paid' ? 'Đã thanh toán' : payment.status === 'overdue' ? 'Quá hạn' : 'Chờ thanh toán'}
                    </StatusPill>
                  </div>

                  {/* Payment breakdown */}
                  {payment.note && (
                    <div className="fade-border" style={{ padding: 12, background: 'rgba(255,255,255,0.02)', marginBottom: 12 }}>
                      <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                        <div className="row-responsive">
                          <span style={{ color: 'var(--muted)' }}>Tiền phòng</span>
                          <span style={{ fontWeight: 600 }}>{money(rentAmount)}</span>
                        </div>
                        {electricityAmount > 0 && (
                          <div className="row-responsive">
                            <span style={{ color: 'var(--muted)' }}>Tiền điện</span>
                            <span style={{ fontWeight: 600 }}>{money(electricityAmount)}</span>
                          </div>
                        )}
                        {waterAmount > 0 && (
                          <div className="row-responsive">
                            <span style={{ color: 'var(--muted)' }}>Tiền nước</span>
                            <span style={{ fontWeight: 600 }}>{money(waterAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>Tổng thanh toán</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: payment.status === "paid" ? 'var(--accent)' : '#ff6b6b' }}>
                        {money(payment.amount)}
                      </div>
                    </div>
                    {payment.status !== "paid" && (
                      <button 
                        className="button-primary" 
                        style={{ padding: "10px 16px" }}
                        onClick={() => {
                          // Parse bill details from note
                          let electricityAmount = 0;
                          let waterAmount = 0;
                          
                          if (payment.note) {
                            const electricityMatch = payment.note.match(/Điện:\s*([\d,]+)/);
                            const waterMatch = payment.note.match(/Nước:\s*([\d,]+)/);
                            if (electricityMatch) electricityAmount = parseInt(electricityMatch[1].replace(/,/g, ''));
                            if (waterMatch) waterAmount = parseInt(waterMatch[1].replace(/,/g, ''));
                          }
                          
                          setCurrentBill({
                            month: payment.title,
                            rent: record?.rent || 0,
                            electricity: electricityAmount,
                            water: waterAmount,
                            total: payment.amount
                          });
                          setIsPaymentOpen(true);
                        }}
                        disabled={paying}
                      >
                        {paying ? 'Đang xử lý...' : 'Thanh toán ngay'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
              Không có hóa đơn nào
            </div>
          )}
        </div>
      </div>

      {currentBill && (
        <PaymentGateway
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setCurrentBill(null);
            setPaying(false);
          }}
          amount={currentBill.total}
          billInfo={{
            month: currentBill.month,
            rent: currentBill.rent,
            electricity: currentBill.electricity,
            water: currentBill.water
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
