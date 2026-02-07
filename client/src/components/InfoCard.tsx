interface InfoCardProps {
  title: string;
  accent?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  padding?: string;
}

export function InfoCard({ title, accent, children, right, padding }: InfoCardProps) {
  return (
    <section className="card" style={{ padding: padding ?? "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="pill"
            style={{ background: accent ?? "rgba(255,255,255,0.05)", color: "#0b1222" }}
          >
            <span style={{ color: "#0b1222", fontWeight: 800 }}>{title}</span>
          </div>
        </div>
        {right}
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}
