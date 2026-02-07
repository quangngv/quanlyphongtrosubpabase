type Status = "paid" | "due" | "overdue" | "completed" | "pending";

export function StatusPill({ status, children }: { status: Status; children?: React.ReactNode }) {
  const palette: Record<Status, { bg: string; color: string }> = {
    paid: { bg: "rgba(111, 243, 176, 0.15)", color: "#8ff0a4" },
    completed: { bg: "rgba(111, 243, 176, 0.15)", color: "#8ff0a4" },
    due: { bg: "rgba(109, 167, 255, 0.15)", color: "#9ec7ff" },
    pending: { bg: "rgba(255, 193, 7, 0.15)", color: "#ffc107" },
    overdue: { bg: "rgba(255, 107, 107, 0.15)", color: "#ff9c9c" },
  };
  const paletteItem = palette[status] || palette.due;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        background: paletteItem.bg,
        color: paletteItem.color,
        border: "1px solid var(--border)",
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: paletteItem.color,
          boxShadow: `0 0 12px ${paletteItem.color}`,
        }}
      />
      <span>{children ?? status}</span>
    </span>
  );
}
