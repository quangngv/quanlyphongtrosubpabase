import { useState } from "react";
import { X, CreditCard, Building2, Smartphone, CheckCircle2, Loader2 } from "lucide-react";

interface PaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  billInfo: {
    month: string;
    rent: number;
    electricity: number;
    water: number;
  };
  onSuccess: () => void;
}

type PaymentStep = "method" | "details" | "processing" | "success";
type PaymentMethod = "card" | "bank" | "momo" | "vnpay";

export function PaymentGateway({ isOpen, onClose, amount, billInfo, onSuccess }: PaymentGatewayProps) {
  const [step, setStep] = useState<PaymentStep>("method");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  if (!isOpen) return null;

  const money = (value: number) =>
    value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });

  const handleMethodSelect = (selectedMethod: PaymentMethod) => {
    setMethod(selectedMethod);
    setStep("details");
  };

  const handlePayment = async () => {
    setStep("processing");
    
    try {
      // Gọi callback onSuccess để thực hiện thanh toán thật qua API
      await onSuccess();
      
      // Hiển thị màn hình thành công
      setStep("success");
      
      // Tự động đóng sau 2 giây
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      console.error('Payment error:', error);
      // Không hiện alert ở đây vì đã có alert trong handlePaymentSuccess
      setStep("method");
    }
  };

  const handleClose = () => {
    setStep("method");
    setCardNumber("");
    setCardName("");
    setExpiry("");
    setCvv("");
    onClose();
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "clamp(12px, 4vw, 20px)",
      }}
      onClick={handleClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 500,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: 0,
          animation: "slideUp 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 480px) {
            .payment-header { padding: 16px !important; }
            .payment-content { padding: 16px !important; }
            .payment-title { font-size: 18px !important; }
            .payment-method-btn { padding: 12px !important; }
          }
        `}</style>

        {/* Header */}
        <div className="payment-header" style={{ padding: 24, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 className="payment-title" style={{ margin: 0, fontSize: "clamp(16px, 5vw, 20px)", wordBreak: "break-word" }}>Thanh toán hóa đơn</h2>
            <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: "clamp(12px, 3.5vw, 14px)" }}>Tháng {billInfo.month}</p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: 8,
              borderRadius: 8,
              flexShrink: 0
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="payment-content" style={{ padding: 24 }}>
          {step === "method" && (
            <div style={{ display: "grid", gap: "clamp(12px, 3vw, 16px)" }}>
              <h3 style={{ margin: 0, fontSize: "clamp(14px, 4vw, 16px)" }}>Chọn phương thức thanh toán</h3>
              
              <button
                onClick={() => handleMethodSelect("card")}
                className="fade-border payment-method-btn"
                style={{
                  padding: "clamp(12px, 3vw, 16px)",
                  textAlign: "left",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <CreditCard size={24} color="var(--accent)" />
                <div>
                  <div style={{ fontWeight: 600 }}>Thẻ tín dụng / Ghi nợ</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>Visa, MasterCard, JCB</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect("bank")}
                className="fade-border"
                style={{
                  padding: 16,
                  textAlign: "left",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Building2 size={24} color="var(--accent-2)" />
                <div>
                  <div style={{ fontWeight: 600 }}>Chuyển khoản ngân hàng</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>Tất cả ngân hàng nội địa</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect("momo")}
                className="fade-border"
                style={{
                  padding: 16,
                  textAlign: "left",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Smartphone size={24} color="#D82D8B" />
                <div>
                  <div style={{ fontWeight: 600 }}>Ví MoMo</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>Thanh toán qua ví điện tử</div>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect("vnpay")}
                className="fade-border"
                style={{
                  padding: 16,
                  textAlign: "left",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Smartphone size={24} color="#0D47A1" />
                <div>
                  <div style={{ fontWeight: 600 }}>VNPay</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>Thanh toán qua VNPay QR</div>
                </div>
              </button>
            </div>
          )}

          {step === "details" && (
            <div style={{ display: "grid", gap: 16 }}>
              <button
                onClick={() => setStep("method")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                  fontSize: 14,
                }}
              >
                ← Quay lại
              </button>

              <h3 style={{ margin: 0, fontSize: 16 }}>Thông tin thanh toán</h3>

              {method === "card" && (
                <>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                      Số thẻ
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "");
                        if (value.length <= 16 && /^\d*$/.test(value)) {
                          setCardNumber(formatCardNumber(value));
                        }
                      }}
                      placeholder="1234 5678 9012 3456"
                      style={{
                        width: "100%",
                        padding: 12,
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        background: "var(--bg)",
                        color: "var(--fg)",
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                      Tên chủ thẻ
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN A"
                      style={{
                        width: "100%",
                        padding: 12,
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        background: "var(--bg)",
                        color: "var(--fg)",
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                        Ngày hết hạn
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 4) {
                            const formatted = value.length >= 3 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;
                            setExpiry(formatted);
                          }
                        }}
                        placeholder="MM/YY"
                        style={{
                          width: "100%",
                          padding: 12,
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          background: "var(--bg)",
                          color: "var(--fg)",
                          fontSize: 14,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 3) setCvv(value);
                        }}
                        placeholder="123"
                        style={{
                          width: "100%",
                          padding: 12,
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          background: "var(--bg)",
                          color: "var(--fg)",
                          fontSize: 14,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {(method === "bank" || method === "momo" || method === "vnpay") && (
                <div
                  style={{
                    padding: 20,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    {method === "bank" && "Bạn sẽ được chuyển đến trang ngân hàng"}
                    {method === "momo" && "Bạn sẽ được chuyển đến ứng dụng MoMo"}
                    {method === "vnpay" && "Bạn sẽ được chuyển đến VNPay"}
                  </p>
                </div>
              )}

              {/* Bill Summary */}
              <div
                className="fade-border"
                style={{
                  padding: 16,
                  background: "rgba(109, 167, 255, 0.05)",
                  borderRadius: 12,
                  marginTop: 8,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Chi tiết thanh toán</div>
                <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Tiền phòng</span>
                    <span>{money(billInfo.rent)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Tiền điện</span>
                    <span>{money(billInfo.electricity)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Tiền nước</span>
                    <span>{money(billInfo.water)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: 12,
                      borderTop: "1px solid var(--border)",
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    <span>Tổng cộng</span>
                    <span style={{ color: "var(--accent)" }}>{money(amount)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={method === "card" && (!cardNumber || !cardName || !expiry || !cvv)}
                className="button-primary"
                style={{
                  width: "100%",
                  padding: 14,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Thanh toán {money(amount)}
              </button>
            </div>
          )}

          {step === "processing" && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Loader2
                size={64}
                color="var(--accent)"
                style={{ animation: "spin 1s linear infinite", margin: "0 auto 20px" }}
              />
              <h3 style={{ margin: "0 0 8px" }}>Đang xử lý thanh toán...</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>Vui lòng không đóng cửa sổ</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {step === "success" && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(108, 242, 194, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <CheckCircle2 size={48} color="var(--accent)" />
              </div>
              <h3 style={{ margin: "0 0 8px", color: "var(--accent)" }}>Thanh toán thành công!</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                Giao dịch đã được xử lý. Hóa đơn sẽ được cập nhật ngay.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
