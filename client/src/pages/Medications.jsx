import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X, Check, Clock, Pill } from "lucide-react";
import { StatCard, SectionRow } from "../components/atoms";
import { useAuth } from "../contexts/AuthContext";
import {
  listMedications, createMedication, deleteMedication,
  todayDoses, toggleDose,
} from "../lib/curasana-api";

const MED_PALETTE = [
  { bg: "var(--teal-light)",   color: "var(--teal)" },
  { bg: "var(--purple-light)", color: "var(--purple)" },
  { bg: "var(--blue-light)",   color: "var(--blue)" },
  { bg: "var(--coral-light)",  color: "var(--coral)" },
  { bg: "var(--amber-light)",  color: "var(--amber)" },
];

export default function Medications() {
  const { user } = useAuth();
  const [meds, setMeds]     = useState([]);
  const [doses, setDoses]   = useState([]);
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({
    name: "", dosage: "", frequency: "Once daily", prescribed_by: "",
  });

  const authId = user?.authId;

  const refresh = async () => {
    if (!authId) return;
    try {
      const [m, d] = await Promise.all([listMedications(authId), todayDoses(authId)]);
      setMeds(m);
      setDoses(d);
    } catch (err) {
      console.error("Failed to load medications:", err);
      toast.error("Failed to load medications");
    }
  };

  useEffect(() => { refresh(); }, [authId]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!authId) { toast.error("Not logged in"); return; }
    setSaving(true);
    try {
      console.log("Creating medication with authId:", authId, "form:", form);
      await createMedication(authId, form);
      toast.success(`Added ${form.name}`);
      setOpen(false);
      setForm({ name: "", dosage: "", frequency: "Once daily", prescribed_by: "" });
      refresh();
    } catch (err) {
      console.error("Failed to add medication:", err);
      toast.error("Failed to add medication: " + (err?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id, name) => {
    try {
      await deleteMedication(id);
      toast.success(`${name} removed`);
      refresh();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete");
    }
  };

  const onToggle = async (d) => {
    try {
      const updated = await toggleDose(d.id, !d.taken);
      setDoses((cur) => cur.map((x) => (x.id === d.id ? { ...x, ...updated } : x)));
      toast.success(updated.taken ? `${d.medication_name} marked taken` : `${d.medication_name} pending`);
    } catch (err) {
      console.error("Toggle failed:", err);
      toast.error("Failed to update dose");
    }
  };

  const takenCount   = doses.filter((d) => d.taken).length;
  const pendingCount = doses.length - takenCount;

  return (
    <div data-testid="medications-page">
      <SectionRow title="Medications" sub="Manage prescriptions & daily doses">
        <button className="cu-btn cu-btn-primary" onClick={() => setOpen(true)} data-testid="add-med-btn">
          <Plus size={14} /> Add Medication
        </button>
      </SectionRow>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <StatCard label="Active Meds" value={meds.filter((m) => m.active).length}
          icon={<Pill size={18} />} iconBg="var(--teal-light)" iconColor="var(--teal)" testId="stat-active-meds" />
        <StatCard label="Taken Today" value={<>{takenCount}<span className="text-xs font-normal"> / {doses.length}</span></>}
          icon={<Check size={18} />} iconBg="var(--blue-light)" iconColor="var(--blue)" testId="stat-taken-today" />
        <StatCard label="Pending" value={pendingCount}
          icon={<Clock size={18} />} iconBg="var(--amber-light)" iconColor="var(--amber)" testId="stat-pending" />
      </div>

      <div className="cu-card mb-4" data-testid="today-doses">
        <SectionRow title="Today's Doses" />
        {doses.length === 0 && <div className="text-sm py-4 text-center" style={{ color: "var(--text3)" }}>No doses scheduled today.</div>}
        {doses.map((d) => (
          <div key={d.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <input type="checkbox" checked={d.taken} onChange={() => onToggle(d)} />
            <div className="flex-1">
              <div className="text-sm font-medium">{d.medication_name} <span className="text-xs" style={{ color: "var(--text3)" }}>{d.dosage}</span></div>
              <div className="text-xs" style={{ color: "var(--text3)" }}>{d.frequency}</div>
            </div>
            <span className={`cu-pill ${d.taken ? "cu-pill-teal" : "cu-pill-amber"}`}>
              {d.taken ? "Taken" : "Pending"}
            </span>
          </div>
        ))}
      </div>

      <div className="cu-card" data-testid="med-table">
        <SectionRow title="All Medications" />
        <table className="cu-table">
          <thead>
            <tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Prescribed By</th><th>Start Date</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {meds.map((m, i) => {
              const p = MED_PALETTE[i % MED_PALETTE.length];
              return (
                <tr key={m.id}>
                  <td><span className="cu-pill" style={{ background: p.bg, color: p.color }}>{m.name}</span></td>
                  <td>{m.dosage}</td>
                  <td>{m.frequency}</td>
                  <td>{m.prescribed_by || "\u2014"}</td>
                  <td>{new Date(m.start_date).toLocaleDateString()}</td>
                  <td><span className={`cu-pill ${m.active ? "cu-pill-teal" : "cu-pill-gray"}`}>{m.active ? "Active" : "Inactive"}</span></td>
                  <td><button onClick={() => onDelete(m.id, m.name)} className="cu-btn cu-btn-ghost" style={{ padding: "5px 9px" }}><Trash2 size={13} /></button></td>
                </tr>
              );
            })}
            {meds.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-xs" style={{ color: "var(--text3)" }}>No medications</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="cu-overlay" onClick={() => setOpen(false)} data-testid="add-med-modal">
          <form onClick={(e) => e.stopPropagation()} onSubmit={onSave} className="cu-modal cu-fade-up">
            <div className="flex items-center justify-between mb-4">
              <div><div className="text-base font-semibold">Add Medication</div><div className="text-xs" style={{ color: "var(--text3)" }}>New prescription</div></div>
              <button type="button" onClick={() => setOpen(false)} className="cu-icon-btn"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="cu-label">Name</label><input className="cu-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="cu-label">Dosage</label><input className="cu-input" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required /></div>
              <div><label className="cu-label">Frequency</label>
                <select className="cu-select" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As needed</option><option>Weekly</option>
                </select>
              </div>
              <div><label className="cu-label">Prescribed By</label><input className="cu-input" value={form.prescribed_by} onChange={(e) => setForm({ ...form, prescribed_by: e.target.value })} placeholder="Dr. ___" /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="submit" disabled={saving} className="cu-btn cu-btn-primary flex-1">{saving ? "Saving\u2026" : "Save"}</button>
              <button type="button" onClick={() => setOpen(false)} className="cu-btn cu-btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
