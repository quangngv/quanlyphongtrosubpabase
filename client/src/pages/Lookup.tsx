import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, CheckCircle2, Home, MapPin, PhoneCall, Wallet, User, Loader2, CreditCard, RefreshCw } from "lucide-react";
import { lookupLease, type LeaseRecord } from "@/api/mockData";
import { useAuth } from "@/context/AuthContext";
import { InfoCard } from "@/components/InfoCard";
import { StatusPill } from "@/components/StatusPill";
import { PaymentGateway } from "@/components/PaymentGateway";
import { clientApiService } from "@/api/apiService";

const money = (value: number) =>
  value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

export function Lookup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState<LeaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<any>(null);
  const unpaidBill = useMemo(
    () => record?.payments?.find((p) => p.status !== "paid"),
    [record]
  );

  // Tự động load thông tin khi có user đăng nhập
  const loadLeaseInfo = async () => {
    if (!user?.phone || !user?.accessCode) {
      setLoading(false);
      setError("Không có thông tin đăng nhập");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await lookupLease(user.accessCode, user.phone);
      setRecord(result);
      if (!result) {
        setError("Không tìm thấy thông tin thuê phòng");
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải thông tin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaseInfo();
  }, [user]);

  // Auto-refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user?.phone && user?.accessCode) {
        loadLeaseInfo();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16 }}>
        <Loader2 size={48} color="var(--accent)" className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ color: "var(--muted)" }}>Đang tải thông tin phòng trọ...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error || !record) {
    return (
      <div style={{ display: "grid", gap: 18 }}>
        <section className="card hero-sheen" style={{ padding: 22, textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 20 }}>
            <User size={48} color="var(--accent)" />
            <h2 style={{ margin: 0 }}>Xin chào, {user?.name || user?.phone}</h2>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {error || "Chưa có thông tin thuê phòng. Vui lòng liên hệ quản lý để được hỗ trợ."}
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Header với thông tin người thuê */}
      <section className="card hero-sheen" style={{ padding: 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="pill" style={{ background: "rgba(108, 242, 194, 0.14)" }}>
                <User size={18} color="var(--accent)" /> Thông tin thuê phòng
              </div>
              <button
                onClick={loadLeaseInfo}
                className="button-secondary"
                style={{ padding: "6px 12px", display: 'inline-flex', alignItems: 'center', gap: 6 }}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Làm mới
              </button>
            </div>
            <h2 style={{ margin: 0, fontSize: 24 }}>Xin chào, {record.tenantName}</h2>
            <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>
              Phòng {record.roomCode} - {record.propertyName}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            {record.currentBill && !record.currentBill.paid ? (
              <>
                <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 4 }}>
                  Hóa đơn tháng {record.currentBill.month}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>
                  {money(record.currentBill.total)}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  Phòng: {money(record.currentBill.rent)} | 
                  Điện: {money(record.currentBill.electricity)} | 
                  Nước: {money(record.currentBill.water)}
                </div>
                <button
                  onClick={() =>
                    navigate("/payment", {
                      state: {
                        bill: {
                          title: `Hóa đơn tháng ${record.currentBill!.month}`,
                          month: record.currentBill!.month,
                          amount: record.currentBill!.total,
                          rent: record.currentBill!.rent,
                          electricity: record.currentBill!.electricity,
                          water: record.currentBill!.water,
                          due: record.nextDue,
                        },
                      },
                    })
                  }
                  className="button-primary"
                  style={{ marginTop: 10, padding: "10px 14px", fontWeight: 700 }}
                >
                  Thanh toán ngay
                </button>
              </>
            ) : record.currentBill?.paid ? (
              <>
                <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 4 }}>
                  Tháng {record.currentBill.month}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>
                  ✓ Đã thanh toán
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  Tổng: {money(record.currentBill.total)}
                </div>
              </>
            ) : (
              <>
                <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 4 }}>Tiền phòng hàng tháng</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{money(record.rent)}</div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Thông tin chi tiết */}
      <div style={{ display: "grid", gap: 16 }}>
          <InfoCard
            title="Thông tin phòng"
            accent="rgba(108, 242, 194, 0.14)"
            right={record.payments?.[0]?.status ? <StatusPill status={record.payments[0].status}>{record.payments[0].status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}</StatusPill> : null}
          >
            <div className="grid-auto">
              <div>
                <div style={{ color: "var(--muted)", marginBottom: 6 }}>Địa điểm</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                  <MapPin size={18} color="var(--accent)" /> {record.address}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", marginBottom: 6 }}>Tòa nhà / phòng</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                  <Home size={18} color="var(--accent-2)" /> {record.propertyName} - {record.roomCode}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", marginBottom: 6 }}>Quản lý</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
                  <PhoneCall size={18} color="var(--accent)" /> {record.manager.name} ({record.manager.phone})
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  Zalo: {record.manager.zalo} | Email: {record.manager.email}
                </div>
              </div>
            </div>
          </InfoCard>

          <div className="grid-auto">
            <InfoCard title="Tiền phòng" accent="rgba(109, 167, 255, 0.1)">
              <div className="row-responsive">
                <div>
                  <div style={{ color: "var(--muted)" }}>Số tiền / tháng</div>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{money(record.rent)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--muted)" }}>Hạn tiếp theo</div>
                  <div style={{ fontWeight: 700 }}>{record.nextDue}</div>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Tiền cọc" accent="rgba(108, 242, 194, 0.1)">
              <div className="row-responsive">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Wallet size={18} color="var(--accent)" />
                  <div>
                    <div style={{ color: "var(--muted)" }}>Đã nộp</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{money(record.deposit)}</div>
                  </div>
                </div>
                <StatusPill status="paid">Đã nhận</StatusPill>
              </div>
            </InfoCard>
          </div>

          <InfoCard title="Tiện ích" accent="rgba(255,255,255,0.08)">
            {record.utilities && record.utilities.length > 0 ? (
              <>
                <div className="grid-auto" style={{ marginBottom: 16 }}>
                  {record.utilities.map((u) => {
                    // Parse pricing and calculate amount - xử lý đúng định dạng Việt Nam
                    const priceMatch = u.pricing.match(/([\d,\.]+)/);
                    const readingMatch = u.latestReading.match(/([\d,\.]+)/);
                    // Xóa tất cả dấu chấm và phẩy (là ngăn cách nghìn trong tiếng Việt)
                    const price = priceMatch ? parseFloat(priceMatch[1].replace(/[,\.]/g, '')) : 0;
                    const reading = readingMatch ? parseFloat(readingMatch[1].replace(/[,\.]/g, '')) : 0;
                    const amount = price * reading;
                    
                    return (
                      <div key={u.name} className="fade-border" style={{ padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{u.name}</div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>
                            {money(amount)}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                          <div className="row-responsive">
                            <span style={{ color: "var(--muted)" }}>Đơn giá</span>
                            <span style={{ fontWeight: 600 }}>{u.pricing}</span>
                          </div>
                          <div className="row-responsive">
                            <span style={{ color: "var(--muted)" }}>Chỉ số mới nhất</span>
                            <span style={{ fontWeight: 600 }}>{u.latestReading}</span>
                          </div>
                          <div className="row-responsive" style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: "var(--muted)" }}>Tạm tính</span>
                            <span style={{ fontWeight: 700, color: 'var(--accent-2)' }}>
                              {price.toLocaleString('vi-VN')} × {reading.toLocaleString('vi-VN')} = {money(amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Tổng hợp điện nước */}
                <div className="fade-border" style={{ 
                  padding: 18, 
                  background: 'linear-gradient(135deg, rgba(108, 242, 194, 0.15) 0%, rgba(109, 167, 255, 0.15) 100%)',
                  borderRadius: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Tổng tiền điện + nước</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
                        {money(
                          record.utilities.reduce((total, u) => {
                            const priceMatch = u.pricing.match(/([\d,\.]+)/);
                            const readingMatch = u.latestReading.match(/([\d,\.]+)/);
                            const price = priceMatch ? parseFloat(priceMatch[1].replace(/[,\.]/g, '')) : 0;
                            const reading = readingMatch ? parseFloat(readingMatch[1].replace(/[,\.]/g, '')) : 0;
                            return total + (price * reading);
                          }, 0)
                        )}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: 40, 
                      opacity: 0.6
                    }}>
                      ⚡💧
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>
                Chưa có thông tin tiện ích
              </div>
            )}
          </InfoCard>

          <InfoCard title="Thanh toán gần nhất" accent="rgba(109, 167, 255, 0.1)">
            <div style={{ display: "grid", gap: 12 }}>
              {record.payments && record.payments.length > 0 ? (
                record.payments.map((p, index) => (
                <div
                  key={p.title || index}
                  className="fade-border row-responsive"
                  style={{ padding: 14 }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <CalendarClock size={18} color="var(--accent-2)" />
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: 13 }}>{p.note}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>{money(p.amount)}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{p.date}</div>
                  </div>
                  <StatusPill status={p.status || 'due'}>{p.status === 'paid' ? 'Đã thanh toán' : p.status === 'overdue' ? 'Quá hạn' : 'Chờ thanh toán'}</StatusPill>
                </div>
              ))
              ) : (
                <div style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>
                  Chưa có lịch sử thanh toán
                </div>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Ghi chú từ quản lý" accent="rgba(108, 242, 194, 0.1)">
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
              {record.notes && record.notes.length > 0 ? (
                record.notes.map((note, index) => (
                <li key={note || index} style={{ color: "var(--muted)" }}>
                  <CheckCircle2 size={14} color="var(--accent)" style={{ marginRight: 8 }} /> {note}
                </li>
              ))
              ) : (
                <li style={{ color: "var(--muted)", listStyle: "none" }}>Không có ghi chú</li>
              )}
            </ul>
          </InfoCard>
        </div>
        
        {/* Payment Gateway Modal */}
        {currentBill ? (
          <PaymentGateway
            isOpen={isPaymentOpen}
            onClose={() => {
              setIsPaymentOpen(false);
              setCurrentBill(null);
            }}
            amount={currentBill.total}
            billInfo={{
              month: currentBill.month,
              rent: currentBill.rent,
              electricity: currentBill.electricity,
              water: currentBill.water
            }}
            onSuccess={async () => {
              if (!user?.phone || !user?.accessCode) {
                throw new Error("Không có thông tin đăng nhập");
              }

              try {
                // Gọi API thanh toán thật
                await clientApiService.payBill(user.phone, user.accessCode);
                
                // Reload data sau khi thanh toán thành công
                const data = await lookupLease(user.accessCode, user.phone);
                if (data) {
                  setRecord(data);
                } else {
                  setError("Không tìm thấy thông tin hợp đồng");
                }
                
                // Thanh toán thành công - không throw error
              } catch (err: any) {
                const errorMessage = err.message || "Lỗi khi thanh toán";
                alert(errorMessage);
                throw err; // Throw để PaymentGateway xử lý
              }
            }}
          />
        ) : null}
      </div>
  );
}
