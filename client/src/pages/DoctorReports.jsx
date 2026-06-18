import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Send, Trash2, FileText, FileOutput } from "lucide-react";
import { SectionRow } from "../components/atoms";
import { useAuth } from "../contexts/AuthContext";
import {
  listReports, createReport, reportPreview, downloadReportPdf, deleteReport,
} from "../lib/curasana-api";

const SECTIONS = [
  { v: "symptoms",     label: "Symptoms & Pain Log",  sub: "All logged symptom events" },
  { v: "medications",  label: "Medications",           sub: "Active and past prescriptions" },
  { v: "appointments", label: "Appointments",          sub: "Past and upcoming visits" },
];

const REPORT_TYPES = [
  "30-Day Health Summary",
  "Medication History",
  "Symptom Log Export",
  "Full Medical History",
];

function isoDate(d) { return d.toISOString().slice(0, 10); }

export default function DoctorReports() {
  const { user } = useAuth();
  const today  = new Date();
  const thirty = new Date(); thirty.setDate(today.getDate() - 30);

  const [reports, setReports]       = useState([]);
  const [form, setForm]             = useState({
    title: "30-Day Health Summary",
    date_range_start: isoDate(thirty),
    date_range_end:   isoDate(today),
    sections: ["symptoms", "medications"],
    recipient: "",
  });
  const [preview, setPreview]       = useState(null);
  const [activeId, setActiveId]     = useState(null);
  const [generating, setGenerating] = useState(false);

  const refresh = async () => {
    if (!user?.patientId) return;
    try { setReports(await listReports(user.patientId)); }
    catch (err) { console.error("Failed to load reports:", err); }
  };

  useEffect(() => { refresh(); }, [user?.patientId]);

  const generate = async (e) => {
    e?.preventDefault();
    if (!user?.patientId) { toast.error("Please complete your profile first."); return; }
    setGenerating(true);
    try {
      const r = await createReport(user.patientId, form);
      const data = await reportPreview(r.id, user.patientId, user.authId);
      setPreview(data);
      setActiveId(r.id);
      try {
        await downloadReportPdf(r.id, user.patientId, user.authId);
        toast.success("Report generated & PDF downloaded!", { description: r.title });
      } catch (pdfErr) {
        console.error("PDF failed:", pdfErr);
        toast.success("Report generated!", { description: "PDF download failed." });
      }
      refresh();
    } catch (err) {
      console.error("Report generation failed:", err);
      toast.error("Failed to generate report: " + (err?.message || "Unknown error"));
    } finally { setGenerating(false); }
  };

  const onDownload = async (id) => {
    try { await downloadReportPdf(id, user.patientId, user.authId); toast.success("PDF download started"); }
    catch (err) { console.error("PDF download error:", err); toast.error("Download failed"); }
  };

  const onSend = () => {
    toast.success("Report queued for delivery", {
      description: form.recipient ? `Will reach ${form.recipient}` : "No recipient \u2014 saved as draft",
    });
  };

  const onPick = async (r) => {
    setActiveId(r.id);
    try { setPreview(await reportPreview(r.id, user.patientId, user.authId)); }
    catch (err) { console.error("Preview failed:", err); toast.error("Could not load preview"); }
  };

  const onDelete = async (id) => {
    await deleteReport(id);
    toast.success("Report deleted");
    if (activeId === id) { setPreview(null); setActiveId(null); }
    refresh();
  };

  const toggleSection = (s) => {
    setForm((f) => ({ ...f, sections: f.sections.includes(s) ? f.sections.filter((x) => x !== s) : [...f.sections, s] }));
  };

  return (
    <div data-testid="reports-page">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <form onSubmit={generate} className="cu-card mb-4" data-testid="report-builder">
            <SectionRow title="Generate New Report" />
            <div className="space-y-4">
              <div>
                <label className="cu-label">Report Type</label>
                <select className="cu-select" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="report-title">
                  {REPORT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="cu-label">From Date</label>
                  <input type="date" className="cu-input" value={form.date_range_start} onChange={(e) => setForm({ ...form, date_range_start: e.target.value })} data-testid="report-start" />
                </div>
                <div>
                  <label className="cu-label">To Date</label>
                  <input type="date" className="cu-input" value={form.date_range_end} onChange={(e) => setForm({ ...form, date_range_end: e.target.value })} data-testid="report-end" />
                </div>
              </div>
              <div>
                <label className="cu-label">Share With (Doctor's Email)</label>
                <input className="cu-input" type="email" placeholder="dr.smith@clinic.com (leave empty to keep private)" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} data-testid="report-recipient" />
                <div className="text-[11px] mt-1.5" style={{ color: "var(--text3)" }}>Your doctor must have a Curasana account to see this report.</div>
              </div>
              <div>
                <label className="cu-label">Include Sections</label>
                <div className="space-y-2">
                  {SECTIONS.map((s) => (
                    <label key={s.v} className="cu-check-item" data-testid={`section-${s.v}`}>
                      <input type="checkbox" checked={form.sections.includes(s.v)} onChange={() => toggleSection(s.v)} />
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-[11px]" style={{ color: "var(--text3)" }}>{s.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={generating} className="cu-btn cu-btn-primary justify-center" style={{ width: "100%" }} data-testid="generate-report-btn">
                <FileOutput size={14} /> {generating ? "Generating\u2026" : "Generate & Download PDF"}
              </button>
              {activeId && (
                <button type="button" onClick={onSend} className="cu-btn cu-btn-ghost justify-center" style={{ width: "100%" }} data-testid="send-report-btn">
                  <Send size={14} /> Send to Doctor
                </button>
              )}
            </div>
          </form>

          <div className="cu-card" data-testid="past-reports">
            <SectionRow title="Past Reports" sub={`${reports.length} generated`} />
            <table className="cu-table">
              <thead><tr><th>Date</th><th>Type</th><th>Shared</th><th></th></tr></thead>
              <tbody>
                {reports.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-xs" style={{ color: "var(--text3)" }}>No reports yet</td></tr>}
                {reports.map((r) => (
                  <tr key={r.id} data-testid={`past-report-${r.id}`}>
                    <td style={{ color: "var(--text2)" }}>{new Date(r.generated_at).toLocaleDateString()}</td>
                    <td><button type="button" onClick={() => onPick(r)} className="font-medium" style={{ color: activeId === r.id ? "var(--teal-d)" : "inherit" }}>{r.title}</button></td>
                    <td style={{ color: "var(--text3)" }}>{r.recipient || "Private"}</td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => onDownload(r.id)} className="cu-btn cu-btn-ghost" style={{ padding: "5px 9px" }}><Download size={12} /></button>
                        <button type="button" onClick={() => onDelete(r.id)} className="cu-btn cu-btn-ghost" style={{ padding: "5px 9px" }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div data-testid="report-preview">
          {!preview && (
            <div className="cu-card text-center" style={{ padding: "48px 24px", color: "var(--text3)" }}>
              <FileText size={48} style={{ color: "var(--border)" }} className="mx-auto mb-3" />
              <div className="text-sm font-medium" style={{ color: "var(--text2)" }}>Report Preview</div>
              <div className="text-xs mt-1.5">Fill in the form and click Generate to preview your doctor report here.</div>
            </div>
          )}
          {preview && (
            <div className="cu-card">
              <div className="pb-3 mb-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="text-xs font-medium" style={{ color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Curasana {"\u00B7"} Health Report</div>
                <div className="text-xs" style={{ color: "var(--text3)" }}>{String(preview.report.id).slice(0, 8)}</div>
              </div>
              <h2 className="text-xl font-semibold">{preview.report.title}</h2>
              <div className="text-xs mt-1" style={{ color: "var(--text3)" }}>{preview.report.date_range_start} {"\u2192"} {preview.report.date_range_end}</div>
              <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--teal-light)", border: "1px solid #B7E8D5" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium" style={{ color: "var(--teal-d)" }}>HEALTH SCORE</div>
                    <div className="text-3xl font-semibold" style={{ color: "var(--teal-d)" }}>{preview.health_score.score}<span className="text-base font-normal">/100</span></div>
                  </div>
                  <span className="cu-pill cu-pill-teal">{preview.health_score.label}</span>
                </div>
              </div>
              {preview.report.sections.includes("symptoms") && (
                <section className="mt-5">
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Symptoms {"\u00B7"} {preview.symptoms.length} entries</div>
                  {preview.symptoms.length === 0 && <div className="text-xs py-2" style={{ color: "var(--text3)" }}>No symptoms logged in this period.</div>}
                  <ul className="text-sm space-y-1 max-h-32 overflow-auto">
                    {preview.symptoms.slice(0, 6).map((s) => (
                      <li key={s.id} className="flex justify-between py-1" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                        <span>{new Date(s.logged_at).toLocaleDateString()} {"\u00B7"} {s.name}</span>
                        <span className="text-xs" style={{ color: "var(--text3)" }}>{s.severity} {"\u00B7"} {s.pain_scale}/10</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {preview.report.sections.includes("medications") && (
                <section className="mt-5">
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Medications</div>
                  {preview.medications.length === 0 && <div className="text-xs py-2" style={{ color: "var(--text3)" }}>No medications on record.</div>}
                  <ul className="text-sm space-y-1">
                    {preview.medications.slice(0, 5).map((m) => (
                      <li key={m.id} className="flex justify-between py-1" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                        <span>{m.name}</span>
                        <span className="text-xs" style={{ color: "var(--text3)" }}>{m.dosage} {"\u00B7"} {m.frequency}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
