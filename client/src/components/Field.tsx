import { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  icon?: ReactNode;
  error?: string | null;
}

export function Field({ label, hint, icon, error, ...rest }: FieldProps) {
  return (
    <label style={{ display: "block" }}>
      <div className="label">
        {icon}
        <span>{label}</span>
      </div>
      <input className="input" {...rest} />
      <div style={{ marginTop: 6, fontSize: 13, color: error ? "var(--danger)" : "var(--muted)" }}>
        {error ? error : hint}
      </div>
    </label>
  );
}
