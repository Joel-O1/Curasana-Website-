import { Construction } from "lucide-react";

export default function ComingSoon() {
  return (
    <div
      className="cu-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "4rem 2rem",
        textAlign: "center",
      }}
    >
      <Construction size={40} style={{ color: "var(--teal)" }} />
      <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text1)" }}>
        Coming soon
      </h2>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text3)" }}>
        This screen hasn’t been built yet.
      </p>
    </div>
  );
}
