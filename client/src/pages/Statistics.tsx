import { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Home, Zap, Droplet, Wallet, BarChart3 } from "lucide-react";
import { lookupLease, type LeaseRecord } from "@/api/mockData";
import { useAuth } from "@/context/AuthContext";

const money = (value: number) =>
  value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

export function Statistics() {
  const { user } = useAuth();
  const [record, setRecord] = useState<LeaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get current month/year
  const currentDate = new Date();
  const currentMonth = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
  const currentMonthName = `Tháng ${currentMonth}`;

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

  const stats = useMemo(() => {
    if (!record) return null;

    const paidPayments = record.payments?.filter(p => p.status === 'paid') || [];
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const avgPayment = paidPayments.length > 0 ? totalPaid / paidPayments.length : 0;
    
    // Parse utilities cost
    let electricityCost = 0;
    let waterCost = 0;
    if (record.utilities) {
      record.utilities.forEach(u => {
        const priceMatch = u.pricing.match(/([\d,\.]+)/);
        const readingMatch = u.latestReading.match(/([\d,\.]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/[,\.]/g, '')) : 0;
        const reading = readingMatch ? parseFloat(readingMatch[1].replace(/[,\.]/g, '')) : 0;
        const amount = price * reading;
        
        if (u.name.toLowerCase().includes('điện')) {
          electricityCost = amount;
        } else if (u.name.toLowerCase().includes('nước')) {
          waterCost = amount;
        }
      });
    }

    const unpaidBills = record.payments?.filter(p => p.status !== 'paid').length || 0;
    const totalUnpaid = record.payments?.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;

    return {
      totalPaid,
      avgPayment,
      paidCount: paidPayments.length,
      electricityCost,
      waterCost,
      unpaidBills,
      totalUnpaid,
      monthlyRent: record.rent,
      deposit: record.deposit,
    };
  }, [record]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ color: "var(--muted)" }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!record || !stats) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ color: "var(--muted)" }}>Không có dữ liệu thống kê</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <section className="card hero-sheen" style={{ padding: 22 }}>
        <div className="pill" style={{ background: "rgba(109, 167, 255, 0.14)", marginBottom: 12 }}>
          <TrendingUp size={18} color="var(--accent-2)" /> Thống kê & Báo cáo
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Tổng quan chi tiêu</h2>
            <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>
              Phòng {record.roomCode} - {record.propertyName}
            </p>
          </div>
          <div style={{ 
            padding: '12px 18px', 
            background: 'rgba(108, 242, 194, 0.15)', 
            borderRadius: 10,
            border: '1px solid rgba(108, 242, 194, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="var(--accent)" />
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Đang xem</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{currentMonthName}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <BarChart3 size={22} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: 18 }}>Biểu đồ chi phí {currentMonthName}</h3>
        </div>
        
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Bar Chart */}
          {(() => {
            const maxValue = Math.max(stats.monthlyRent, stats.electricityCost, stats.waterCost);
            const total = stats.monthlyRent + stats.electricityCost + stats.waterCost;
            
            return (
              <>
                {/* Rent Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Home size={18} color="var(--accent)" />
                      <span style={{ fontWeight: 700 }}>Tiền phòng</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{money(stats.monthlyRent)}</span>
                  </div>
                  <div style={{ 
                    height: 40, 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: 8, 
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(stats.monthlyRent / maxValue) * 100}%`,
                      background: 'linear-gradient(90deg, rgba(108, 242, 194, 0.8), rgba(108, 242, 194, 0.4))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 12,
                      transition: 'width 0.5s ease',
                      borderRadius: 8
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                        {((stats.monthlyRent / total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Electricity Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Zap size={18} color="var(--accent-2)" />
                      <span style={{ fontWeight: 700 }}>Tiền điện</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{money(stats.electricityCost)}</span>
                  </div>
                  <div style={{ 
                    height: 40, 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: 8, 
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(stats.electricityCost / maxValue) * 100}%`,
                      background: 'linear-gradient(90deg, rgba(109, 167, 255, 0.8), rgba(109, 167, 255, 0.4))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 12,
                      transition: 'width 0.5s ease',
                      borderRadius: 8
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                        {((stats.electricityCost / total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Water Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Droplet size={18} color="#52B2FF" />
                      <span style={{ fontWeight: 700 }}>Tiền nước</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{money(stats.waterCost)}</span>
                  </div>
                  <div style={{ 
                    height: 40, 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: 8, 
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(stats.waterCost / maxValue) * 100}%`,
                      background: 'linear-gradient(90deg, rgba(82, 178, 255, 0.8), rgba(82, 178, 255, 0.4))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 12,
                      transition: 'width 0.5s ease',
                      borderRadius: 8
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                        {((stats.waterCost / total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div style={{ 
                  borderTop: '2px solid rgba(255,255,255,0.1)', 
                  paddingTop: 16, 
                  marginTop: 8 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>Tổng chi phí tháng này</span>
                    <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>
                      {money(total)}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-auto" style={{ gap: 16 }}>
        {/* Total Paid */}
        <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(108, 242, 194, 0.1) 0%, rgba(108, 242, 194, 0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 10, background: 'rgba(108, 242, 194, 0.2)', borderRadius: 10 }}>
              <DollarSign size={22} color="var(--accent)" />
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Tổng đã thanh toán</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{money(stats.totalPaid)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            {stats.paidCount} lần thanh toán
          </div>
        </div>

        {/* Average Payment */}
        <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(109, 167, 255, 0.1) 0%, rgba(109, 167, 255, 0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 10, background: 'rgba(109, 167, 255, 0.2)', borderRadius: 10 }}>
              <TrendingUp size={22} color="var(--accent-2)" />
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Trung bình/tháng</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-2)' }}>{money(stats.avgPayment)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            Dựa trên {stats.paidCount} kỳ thanh toán
          </div>
        </div>

        {/* Unpaid Bills */}
        {stats.unpaidBills > 0 && (
          <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ padding: 10, background: 'rgba(255, 107, 107, 0.2)', borderRadius: 10 }}>
                <Calendar size={22} color="#ff6b6b" />
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Chưa thanh toán</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#ff6b6b' }}>{money(stats.totalUnpaid)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              {stats.unpaidBills} hóa đơn chưa thanh toán
            </div>
          </div>
        )}
      </div>

      {/* Monthly Breakdown */}
      <div className="card" style={{ padding: 22 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Chi tiết hàng tháng</h3>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="fade-border" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Home size={20} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 700 }}>Tiền phòng</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Cố định hàng tháng</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{money(stats.monthlyRent)}</div>
          </div>

          <div className="fade-border" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Zap size={20} color="var(--accent-2)" />
              <div>
                <div style={{ fontWeight: 700 }}>Tiền điện</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Theo chỉ số hiện tại</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-2)' }}>{money(stats.electricityCost)}</div>
          </div>

          <div className="fade-border" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Droplet size={20} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 700 }}>Tiền nước</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Theo chỉ số hiện tại</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{money(stats.waterCost)}</div>
          </div>

          <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Dự kiến tháng này</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Phòng + Điện + Nước</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
                {money(stats.monthlyRent + stats.electricityCost + stats.waterCost)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Info */}
      <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(108, 242, 194, 0.08) 0%, rgba(109, 167, 255, 0.08) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Wallet size={24} color="var(--accent)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Tiền cọc đã nộp</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Sẽ được hoàn trả khi kết thúc hợp đồng</div>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{money(stats.deposit)}</div>
        </div>
      </div>
    </div>
  );
}
