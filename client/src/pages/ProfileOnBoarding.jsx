import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Heart, ArrowRight, ArrowLeft, Check, Plus, X, Sparkles,
  UserCircle, Pill, Activity, Trophy, SkipForward,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createMedicationOnboarding, createSymptom, updateSettings } from "../lib/curasana-api";

const STEPS = [
  { key: "welcome",     title: "Welcome",          icon: Sparkles },
  { key: "profile",     title: "About You",        icon: UserCircle },
  { key: "medications", title: "Medications",       icon: Pill },
  { key: "symptoms",    title: "Recent Symptoms",   icon: Activity },
  { key: "done",        title: "All Set",           icon: Trophy },
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const SEVERITIES  = ["mild", "moderate", "severe"];
const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "As needed", "Weekly"];
const COMMON_SYMPTOMS = ["Headache", "Migraine", "Fatigue", "Nausea", "Joint Pain", "Insomnia", "Anxiety", "Back Pain"];

export default function ProfileOnBoarding() {
  const navigate = useNavigate();
  const { user, markOnboarded } = useAuth();
  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState(1);
  const [busy, setBusy]           = useState(false);

  const [profile, setProfile] = useState({
    date_of_birth: "", blood_type: "Unknown",
    height_cm: "", weight_kg: "", location: "",
  });
  const [medications, setMedications] = useState([]);
  const [symptoms, setSymptoms]       = useState([]);

  const next = () => { setDirection(1);  setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prev = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const finish = async () => {
    setBusy(true);
    try {
      await updateSettings(user.patientId, {
        first_name:    user?.name?.split(" ")[0] || null,
        last_name:     user?.name?.split(" ").slice(1).join(" ") || null,
        date_of_birth: profile.date_of_birth || null,
        blood_type:    profile.blood_type || "Unknown",
        height_cm:     profile.height_cm ? parseInt(profile.height_cm) : null,
        weight_kg:     profile.weight_kg ? parseInt(profile.weight_kg) : null,
        location:      profile.location || null,
      });

      for (const m of medications) {
        await createMedicationOnboarding(user.authId, m).catch(() => {});
      }
      for (const s of symptoms) {
        await createSymptom(user.patientId, s).catch(() => {});
      }

      await markOnboarded();
      toast.success("Your profile is set!", { description: "Welcome to Curasana." });
      navigate("/dashboard", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Could not save your profile, but you can continue.");
      await markOnboarded().catch(() => {});
      navigate("/dashboard", { replace: true });
    } finally { setBusy(false); }
  };

  const current = STEPS[step];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }} data-testid="onboarding-page">
      {/* Header */}
      <header className="px-6 md:px-12 py-5 max-w-3xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--teal)" }}>
            <Heart size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="text-lg font-semibold" style={{ letterSpacing: "-0.02em" }}>Curasana</div>
        </div>
      </header>

      {/* Progress stepper */}
      <div className="max-w-3xl w-full mx-auto px-6 md:px-12 mb-6">
        <div className="flex items-center gap-2" data-testid="onboarding-progress">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: i < step ? "var(--teal)" : i === step ? "var(--teal-light)" : "var(--gray-soft)",
                    border: `2px solid ${i <= step ? "var(--teal)" : "var(--border)"}`,
                  }}>
                  {i < step
                    ? <Check size={13} color="#fff" strokeWidth={3} />
                    : <span className="text-[10px] font-semibold" style={{ color: i === step ? "var(--teal-d)" : "var(--text3)" }}>{i + 1}</span>}
                </div>
                <div className="text-[10px] font-medium hidden md:block"
                  style={{ color: i <= step ? "var(--text2)" : "var(--text3)" }}>{s.title}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 -mt-4" style={{ background: i < step ? "var(--teal)" : "var(--border)" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Card with step content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-2xl">
          <div key={step} className="cu-card cu-onboard-slide" data-testid={`step-${current.key}`}>
            {step === 0 && <WelcomeStep user={user} onNext={next} />}
            {step === 1 && <ProfileStep value={profile} onChange={setProfile} onNext={next} onSkip={next} />}
            {step === 2 && <MedicationsStep items={medications} setItems={setMedications} onNext={next} onSkip={next} />}
            {step === 3 && <SymptomsStep items={symptoms} setItems={setSymptoms} onNext={next} onSkip={next} />}
            {step === 4 && <DoneStep
              counts={{ medications: medications.length, symptoms: symptoms.length }}
              busy={busy} onFinish={finish}
            />}
          </div>

          {step > 0 && step < STEPS.length - 1 && (
            <div className="flex justify-center mt-4">
              <button type="button" onClick={prev} className="cu-link" data-testid="onboarding-back">
                <ArrowLeft size={12} /> Back
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes cu-onboard-in {
          from { opacity: 0; transform: translateX(${direction > 0 ? '24px' : '-24px'}) scale(0.98); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .cu-onboard-slide { animation: cu-onboard-in 340ms cubic-bezier(.4,0,.2,1) both; }
        @keyframes cu-pop-in {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .cu-pop { animation: cu-pop-in 480ms cubic-bezier(.4,0,.2,1) both; }
        @keyframes cu-confetti-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        .cu-confetti { animation: cu-confetti-float 2.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ============ STEP COMPONENTS ============

function StepHeader({ Icon, title, sub, color = "var(--teal)" }) {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center cu-pop"
        style={{ background: "var(--teal-light)", color }}>
        <Icon size={26} strokeWidth={2} />
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold mt-4" style={{ letterSpacing: "-0.02em" }}>{title}</h2>
      {sub && <p className="text-sm mt-1.5 max-w-md" style={{ color: "var(--text2)" }}>{sub}</p>}
    </div>
  );
}

function StepActions({ onNext, onSkip, nextLabel = "Continue", nextDisabled, testIdPrefix = "" }) {
  return (
    <div className="flex items-center gap-2 mt-6 justify-end flex-wrap">
      {onSkip && (
        <button type="button" onClick={onSkip} className="cu-btn cu-btn-ghost" data-testid={`${testIdPrefix}skip`}>
          <SkipForward size={13} /> Skip for now
        </button>
      )}
      <button type="button" onClick={onNext} disabled={nextDisabled}
        className="cu-btn cu-btn-primary" style={{ padding: "11px 22px" }}
        data-testid={`${testIdPrefix}next`}>
        {nextLabel} <ArrowRight size={14} />
      </button>
    </div>
  );
}

function WelcomeStep({ user, onNext }) {
  const first = (user?.name || "there").split(" ")[0];
  return (
    <div className="text-center py-4">
      <div className="text-4xl mb-3">{"\uD83D\uDC4B"}</div>
      <h2 className="text-3xl md:text-4xl font-semibold" style={{ letterSpacing: "-0.02em" }}>
        Welcome, <span style={{ color: "var(--teal)" }}>{first}</span>
      </h2>
      <p className="mt-4 text-base max-w-md mx-auto" style={{ color: "var(--text2)" }}>
        Let's build your health profile. It takes 2 minutes and unlocks personalized insights from day one.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
        {[
          { Icon: UserCircle, label: "Profile" },
          { Icon: Pill,       label: "Medications" },
          { Icon: Activity,   label: "Symptoms" },
        ].map((it, i) => (
          <div key={i} className="p-3 rounded-xl text-center" style={{ background: "var(--gray-soft)" }}>
            <it.Icon size={20} color="var(--teal)" className="mx-auto" />
            <div className="text-[11px] mt-2 font-medium" style={{ color: "var(--text2)" }}>{it.label}</div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onNext} className="cu-btn cu-btn-primary mt-7" style={{ padding: "12px 24px" }} data-testid="welcome-next">
        Let's go <ArrowRight size={14} />
      </button>
      <div className="text-[11px] mt-3" style={{ color: "var(--text3)" }}>You can edit everything later in Settings.</div>
    </div>
  );
}

function ProfileStep({ value, onChange, onNext, onSkip }) {
  return (
    <div>
      <StepHeader Icon={UserCircle} title="About you" sub="Basic info helps us tailor your dashboard." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="cu-label">Date of Birth</label>
          <input type="date" className="cu-input" value={value.date_of_birth}
            onChange={(e) => onChange({ ...value, date_of_birth: e.target.value })}
            data-testid="profile-dob" />
        </div>
        <div>
          <label className="cu-label">Blood Type</label>
          <select className="cu-select" value={value.blood_type}
            onChange={(e) => onChange({ ...value, blood_type: e.target.value })}
            data-testid="profile-blood">
            {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="cu-label">Height (cm)</label>
          <input type="number" className="cu-input" placeholder="170" value={value.height_cm}
            onChange={(e) => onChange({ ...value, height_cm: e.target.value })}
            data-testid="profile-height" />
        </div>
        <div>
          <label className="cu-label">Weight (kg)</label>
          <input type="number" className="cu-input" placeholder="70" value={value.weight_kg}
            onChange={(e) => onChange({ ...value, weight_kg: e.target.value })}
            data-testid="profile-weight" />
        </div>
        <div className="md:col-span-2">
          <label className="cu-label">Location</label>
          <input className="cu-input" placeholder="City, Country" value={value.location}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
            data-testid="profile-location" />
        </div>
      </div>
      <StepActions onNext={onNext} onSkip={onSkip} testIdPrefix="profile-" />
    </div>
  );
}

function MedicationsStep({ items, setItems, onNext, onSkip }) {
  const [form, setForm] = useState({ name: "", dosage: "", frequency: "Once daily", prescribed_by: "" });
  const add = () => {
    if (!form.name.trim()) return;
    setItems([...items, { ...form, active: true }]);
    setForm({ name: "", dosage: "", frequency: "Once daily", prescribed_by: "" });
  };
  const remove = (i) => setItems(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <StepHeader Icon={Pill} title="Daily medications?" sub="List anything you take regularly. We'll add them to your daily checklist." />
      <div className="p-3 rounded-xl space-y-2" style={{ background: "var(--gray-soft)" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="cu-input" placeholder="Medication name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            data-testid="med-name" />
          <input className="cu-input" placeholder="Dosage (e.g. 200mg)"
            value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            data-testid="med-dosage" />
          <select className="cu-select" value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <input className="cu-input" placeholder="Prescribed by (optional, e.g. Dr. Smith)"
          value={form.prescribed_by} onChange={(e) => setForm({ ...form, prescribed_by: e.target.value })} />
        <button type="button" onClick={add} disabled={!form.name.trim() || !form.dosage.trim()}
          className="cu-btn cu-btn-secondary" style={{ fontSize: 12 }} data-testid="med-add">
          <Plus size={12} /> Add Medication
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-4 space-y-1.5" data-testid="med-list">
          <div className="cu-label">Added ({items.length})</div>
          {items.map((m, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl cu-pop" style={{ background: "var(--teal-light)" }}>
              <div className="text-sm">
                <strong>{m.name}</strong>
                <span className="text-xs ml-2" style={{ color: "var(--text2)" }}>{m.dosage} · {m.frequency}</span>
              </div>
              <button type="button" onClick={() => remove(i)} className="cu-icon-btn" style={{ width: 28, height: 28 }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <StepActions onNext={onNext} onSkip={items.length === 0 ? onSkip : undefined} testIdPrefix="meds-" />
    </div>
  );
}

function SymptomsStep({ items, setItems, onNext, onSkip }) {
  const [form, setForm] = useState({ name: "", severity: "moderate", pain_scale: 5, notes: "" });
  const add = () => {
    if (!form.name.trim()) return;
    setItems([...items, { ...form }]);
    setForm({ name: "", severity: "moderate", pain_scale: 5, notes: "" });
  };
  const quickAdd = (name) => { setForm((f) => ({ ...f, name })); };
  const remove = (i) => setItems(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <StepHeader Icon={Activity} title="Any current symptoms?" sub="Log anything you've felt recently. We'll start tracking patterns immediately." />
      <div className="mb-4">
        <div className="cu-label">Quick pick</div>
        <div className="flex flex-wrap gap-2 mt-1">
          {COMMON_SYMPTOMS.map((n) => (
            <button key={n} type="button" onClick={() => quickAdd(n)}
              className={`cu-pill ${form.name === n ? "cu-pill-teal" : "cu-pill-gray"}`}
              style={{ cursor: "pointer" }} data-testid={`quick-symptom-${n}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3 rounded-xl space-y-2" style={{ background: "var(--gray-soft)" }}>
        <input className="cu-input" placeholder="Symptom name"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          data-testid="symptom-name" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select className="cu-select" value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs whitespace-nowrap" style={{ color: "var(--text3)" }}>Pain {form.pain_scale}/10</span>
            <input type="range" min={1} max={10} value={form.pain_scale}
              onChange={(e) => setForm({ ...form, pain_scale: parseInt(e.target.value) })}
              className="flex-1" />
          </div>
        </div>
        <input className="cu-input" placeholder="Notes (optional)"
          value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="button" onClick={add} disabled={!form.name.trim()}
          className="cu-btn cu-btn-secondary" style={{ fontSize: 12 }} data-testid="symptom-add">
          <Plus size={12} /> Add Symptom
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-4 space-y-1.5" data-testid="symptom-list">
          <div className="cu-label">Logged ({items.length})</div>
          {items.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl cu-pop" style={{ background: "var(--teal-light)" }}>
              <div className="text-sm">
                <strong>{s.name}</strong>
                <span className="text-xs ml-2" style={{ color: "var(--text2)" }}>{s.severity} · pain {s.pain_scale}/10</span>
              </div>
              <button type="button" onClick={() => remove(i)} className="cu-icon-btn" style={{ width: 28, height: 28 }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <StepActions onNext={onNext} onSkip={items.length === 0 ? onSkip : undefined}
        nextLabel="Finish setup" testIdPrefix="symptoms-" />
    </div>
  );
}

function DoneStep({ counts, busy, onFinish }) {
  const total = counts.medications + counts.symptoms;
  return (
    <div className="text-center py-4">
      <div className="text-5xl cu-confetti mb-2">{"\uD83C\uDF89"}</div>
      <h2 className="text-3xl md:text-4xl font-semibold" style={{ letterSpacing: "-0.02em" }}>You're all set!</h2>
      <p className="mt-3 text-base max-w-md mx-auto" style={{ color: "var(--text2)" }}>
        {total > 0
          ? `We'll start tracking ${counts.medications} ${counts.medications === 1 ? "medication" : "medications"} and ${counts.symptoms} ${counts.symptoms === 1 ? "symptom" : "symptoms"} on your dashboard.`
          : "You can add details anytime from the dashboard."}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 max-w-sm mx-auto">
        <div className="p-3 rounded-xl cu-pop" style={{ background: "var(--teal-light)" }}>
          <div className="text-2xl font-semibold" style={{ color: "var(--teal-d)" }}>{counts.medications}</div>
          <div className="text-[11px] mt-1" style={{ color: "var(--text2)" }}>Medications</div>
        </div>
        <div className="p-3 rounded-xl cu-pop" style={{ background: "var(--purple-light)", animationDelay: "100ms" }}>
          <div className="text-2xl font-semibold" style={{ color: "var(--purple-d)" }}>{counts.symptoms}</div>
          <div className="text-[11px] mt-1" style={{ color: "var(--text2)" }}>Symptoms</div>
        </div>
      </div>
      <button type="button" onClick={onFinish} disabled={busy}
        className="cu-btn cu-btn-primary mt-7" style={{ padding: "12px 24px" }}
        data-testid="onboarding-finish">
        {busy ? "Setting up your dashboard\u2026" : <>Go to my Dashboard <ArrowRight size={14} /></>}
      </button>
    </div>
  );
}
