import React from "react";

export function StatCard({ label, value, icon, iconBg, iconColor, testId }) {
  return (
    <div className="cu-card flex items-center gap-3" data-testid={testId}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs" style={{ color: "var(--text3)" }}>{label}</div>
        <div className="text-xl font-semibold" style={{ letterSpacing: "-0.02em" }}>{value}</div>
      </div>
    </div>
  );
}

export function SectionRow({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="text-base font-semibold">{title}</div>
        {sub && <div className="text-xs" style={{ color: "var(--text3)" }}>{sub}</div>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
