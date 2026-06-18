import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Lock, Eye, EyeOff } from "lucide-react";

export function SettingsBackLink({ to = "/settings", label = "Back to Settings" }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        color: "var(--text3)",
        textDecoration: "none",
        marginBottom: 20,
      }}
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}

export function SettingsNavRow({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        textDecoration: "none",
        color: "inherit",
        borderBottom: "1px solid var(--border-soft)",
        transition: "background 120ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--gray-soft)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        className="cu-stat-icon"
        style={{ background: "var(--teal-light)", width: 36, height: 36, flexShrink: 0 }}
      >
        <Icon size={17} style={{ color: "var(--teal)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      <ChevronRight size={18} style={{ color: "var(--text3)", flexShrink: 0 }} />
    </Link>
  );
}

export function SectionCard({ icon: Icon, title, subtitle, children, footer }) {
  return (
    <div className="cu-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "18px 20px",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <div
          className="cu-stat-icon"
          style={{ background: "var(--teal-light)", width: 38, height: 38 }}
        >
          <Icon size={18} style={{ color: "var(--teal)" }} />
        </div>
        <div>
          <div className="cu-section-title">{title}</div>
          {subtitle && <div className="cu-section-sub">{subtitle}</div>}
        </div>
      </div>

      <div style={{ padding: "20px" }}>{children}</div>

      {footer && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "16px 20px",
            borderTop: "1px solid var(--border-soft)",
            background: "var(--gray-soft)",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export function PasswordField({ label, value, onChange, placeholder, autoComplete = "new-password" }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="cu-label">{label}</label>
      <div style={{ position: "relative" }}>
        <Lock
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text3)",
          }}
        />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="cu-input"
          style={{ paddingLeft: 34, paddingRight: 38 }}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            border: "none",
            background: "transparent",
            color: "var(--text3)",
            cursor: "pointer",
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
