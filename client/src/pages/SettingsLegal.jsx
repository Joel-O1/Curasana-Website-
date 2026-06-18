import { useState } from "react";
import { ShieldCheck, FileText, ChevronDown } from "lucide-react";
import { SectionCard, SettingsBackLink } from "../components/settings/SettingsUI";

function LegalItem({ title, summary, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          background: "var(--surface)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{summary}</div>
        </div>
        <ChevronDown
          size={18}
          style={{
            color: "var(--text3)",
            flexShrink: 0,
            transition: "transform 160ms ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      {open && (
        <div
          style={{
            padding: "0 16px 16px",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text2)",
            borderTop: "1px solid var(--border-soft)",
            paddingTop: 14,
          }}
        >
          {body}
        </div>
      )}
    </div>
  );
}

export default function SettingsLegal() {
  return (
    <div className="cu-fade-up" style={{ maxWidth: 620 }}>
      <SettingsBackLink />

      <SectionCard
        icon={ShieldCheck}
        title="Legal & Privacy"
        subtitle="How we handle your data"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <LegalItem
            title="Terms of Service"
            summary="The agreement governing your use of Curasana"
            body={
              <>
                By using Curasana you agree to use the platform for personal health
                tracking purposes only. Curasana is not a substitute for professional
                medical advice, diagnosis, or treatment. Always consult a qualified
                healthcare provider regarding any medical concerns. We may update these
                terms periodically and will notify you of material changes.
              </>
            }
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingTop: 4,
              fontSize: 12,
            }}
          >
            <FileText size={14} style={{ color: "var(--text3)" }} />
            <span style={{ color: "var(--text3)" }}>
              Last updated June 2026 · Curasana Health
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
