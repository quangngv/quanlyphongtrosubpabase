import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { payBill } from "@/api/mockData";
import { useAuth } from "@/context/AuthContext";

interface BillState {
  title: string;
  amount: number;
  month?: string;
  rent?: number;
  electricity?: number;
  water?: number;
  due?: string;
}

const money = (value: number) =>
  value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

export function PaymentMock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const bill = (location.state as { bill?: BillState })?.bill || {
    title: "Hóa đơn mẫu",
    amount: 1200000,
    month: "Tháng này",
    rent: 1000000,
    electricity: 100000,
    water: 100000,
    due: "15/02/2026",
  };

  // Đảm bảo luôn có đủ các khoản để hiển thị đồng bộ với admin
  const rent = bill.rent ?? 0;
  const electricity = bill.electricity ?? 0;
  const water = bill.water ?? 0;
  const derivedTotal = bill.amount ?? rent + electricity + water;

  const [step, setStep] = useState<"review" | "processing" | "done" | "error">("review");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Reset when bill changes
    setStep("review");
    setErrorMsg(null);
    setCardNumber("");
    setCardName("");
    setExp("");
    setCvc("");
    setEmail("");
  }, [bill.title, bill.amount]);

  const formatCardNumber = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExp = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const startPayment = async () => {
    if (!user?.phone || !user?.accessCode) {
      setErrorMsg("Không có thông tin người dùng");
      setStep("error");
      return;
    }

    setStep("processing");
    setErrorMsg(null);
    
    try {
      await payBill(user.phone, user.accessCode);
      setStep("done");
    } catch (error: any) {
      setErrorMsg(error.message || "Thanh toán thất bại");
      setStep("error");
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section className="card hero-sheen" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div className="pill" style={{ background: "rgba(108, 242, 194, 0.14)", marginBottom: 10 }}>
              <ShieldCheck size={18} color="var(--accent)" /> Stripe mock checkout
            </div>
            <h2 style={{ margin: 0 }}>Thanh toán thử Stripe</h2>
            <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
              Mô phỏng giao diện Stripe Checkout để bạn test nhanh luồng thanh toán
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="button-secondary"
            style={{ padding: "10px 16px" }}
          >
            Quay lại
          </button>
        </div>
      </section>

      {step === "done" ? (
        <section className="card" style={{ padding: 22, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckCircle2 size={22} color="#46e3b7" />
            <div>
              <div style={{ fontWeight: 800 }}>Thanh toán thành công</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Giao dịch đã được xử lý và lưu vào hệ thống</div>
            </div>
          </div>
          <div className="fade-border" style={{ padding: 12, display: "grid", gap: 8 }}>
            <div className="row-responsive" style={{ fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Khoản thanh toán</span>
              <span style={{ fontWeight: 700 }}>{bill.title}</span>
            </div>
            <div className="row-responsive" style={{ fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Tiền phòng</span>
              <span style={{ fontWeight: 600 }}>{money(rent)}</span>
            </div>
            <div className="row-responsive" style={{ fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Tiền điện</span>
              <span style={{ fontWeight: 600 }}>{money(electricity)}</span>
            </div>
            <div className="row-responsive" style={{ fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Tiền nước</span>
              <span style={{ fontWeight: 600 }}>{money(water)}</span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8, marginTop: 4 }}>
              <div className="row-responsive" style={{ fontWeight: 700, fontSize: 15 }}>
                <span>Tổng cộng</span>
                <span style={{ color: "var(--accent)" }}>{money(derivedTotal)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button-primary" onClick={() => navigate("/lookup", { replace: true })}>
              Quay lại xem hóa đơn
            </button>
          </div>
        </section>
      ) : step === "error" ? (
        <section className="card" style={{ padding: 22, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={22} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 800, color: "#ef4444" }}>Thanh toán thất bại</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{errorMsg || "Đã có lỗi xảy ra"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button-primary" onClick={() => setStep("review")}>
              Thử lại
            </button>
            <button className="button-secondary" onClick={() => navigate("/lookup", { replace: true })}>
              Quay lại
            </button>
          </div>
        </section>
      ) : (
        <div className="grid-auto" style={{ gap: 16 }}>
          <section className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{bill.month || "Chu kỳ"}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{bill.title}</div>
                {bill.due && <div style={{ color: "var(--muted)", fontSize: 13 }}>Hạn thanh toán: {bill.due}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Tổng cần thanh toán</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{money(derivedTotal)}</div>
              </div>
            </div>
            <div className="fade-border" style={{ padding: 12, display: "grid", gap: 8 }}>
              <div className="row-responsive" style={{ fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Tiền phòng</span>
                <span style={{ fontWeight: 600 }}>{money(rent)}</span>
              </div>
              <div className="row-responsive" style={{ fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Tiền điện</span>
                <span style={{ fontWeight: 600 }}>{money(electricity)}</span>
              </div>
              <div className="row-responsive" style={{ fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Tiền nước</span>
                <span style={{ fontWeight: 600 }}>{money(water)}</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8 }}>
                <div className="row-responsive" style={{ fontWeight: 700 }}>
                  <span>Tổng cộng</span>
                  <span>{money(rent + electricity + water || derivedTotal)}</span>
                </div>
              </div>
            </div>
            <div className="fade-border" style={{ padding: 12, background: "rgba(255,255,255,0.02)", display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Thẻ test Stripe</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Dùng 4242 4242 4242 4242 — MM/YY bất kỳ trong tương lai, CVC bất kỳ.
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: 20, display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CreditCard size={18} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 700 }}>Thông tin thẻ</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Mô phỏng Stripe Elements</div>
              </div>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Tên trên thẻ</span>
              <input
                className="input"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="NGUYEN VAN A"
                required
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Email nhận biên lai</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@example.com"
                required
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Số thẻ</span>
              <input
                className="input"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                required
              />
            </label>

            <div className="row-responsive" style={{ gap: 12 }}>
              <label style={{ display: "grid", gap: 6, flex: 1 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>MM/YY</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={exp}
                  onChange={(e) => setExp(formatExp(e.target.value))}
                  placeholder="12/30"
                  required
                />
              </label>
              <label style={{ display: "grid", gap: 6, width: 120 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>CVC</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  required
                />
              </label>
            </div>

            <button
              className="button-primary"
              onClick={startPayment}
              disabled={step === "processing"}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}
            >
              {step === "processing" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>Thanh toán {money(derivedTotal)}</>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 12 }}>
              <Lock size={14} /> Phiên giả lập Stripe, không trừ tiền thật.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
