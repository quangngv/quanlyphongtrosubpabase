import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Phone, Shield } from "lucide-react";
import { Field } from "@/components/Field";
import { useAuth } from "@/context/AuthContext";

export function Login() {
  const { user, login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/lookup";

  const [phone, setPhone] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/lookup", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login({ phone, accessCode });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setLocalError(message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="card" style={{ padding: 32, maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="pill" style={{ marginBottom: 16 }}>
            <Shield size={18} color="var(--accent)" />
            <span>Đăng nhập người thuê</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Theo dõi phòng trọ</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Nhập thông tin mà quản lý đã cung cấp
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <Field
            label="Số điện thoại"
            hint="Số mà quản lý đã đăng ký cho bạn"
            icon={<Phone size={16} color="var(--accent-2)" />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="090xxxxxxx"
            required
          />
          <Field
            label="Mã truy cập"
            hint="Mã hợp đồng được quản lý cung cấp (VD: BA23-4589)"
            icon={<KeyRound size={16} color="var(--accent)" />}
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã" 
            required
          />
          {(error || localError) && (
            <div style={{ color: "var(--danger)", fontWeight: 700 }}>{error ?? localError}</div>
          )}

          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? "Đang kiểm tra..." : "Theo dõi phòng trọ"}
          </button>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5, textAlign: "center" }}>
            Thông tin đăng nhập được <strong>quản lý phòng trọ</strong> cung cấp khi ký hợp đồng.
          </p>
        </form>
      </div>
    </div>
  );
}
