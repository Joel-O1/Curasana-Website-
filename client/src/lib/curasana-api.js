import { supabase } from "./supabaseClient";

// --- Profile / Settings (uses integer patientId) ---
export async function updateSettings(patientId, profile) {
  const { error } = await supabase
    .from("patient_profiles")
    .update({
      first_name:    profile.first_name   ?? null,
      last_name:     profile.last_name    ?? null,
      date_of_birth: profile.date_of_birth || null,
      blood_type:    profile.blood_type   || "Unknown",
      height_cm:     profile.height_cm    ? parseInt(profile.height_cm) : null,
      weight_kg:     profile.weight_kg    ? parseInt(profile.weight_kg) : null,
      location:      profile.location     || null,
    })
    .eq("id", patientId);
  if (error) throw error;
}

export function parsePatientAddress(location) {
  if (!location) {
    return { streetAddress: "", city: "", province: "", postalCode: "" };
  }

  try {
    const parsed = JSON.parse(location);
    if (parsed && typeof parsed === "object") {
      return {
        streetAddress: parsed.street || "",
        city: parsed.city || "",
        province: parsed.province || "",
        postalCode: parsed.postal || "",
      };
    }
  } catch {
    // Fall through for legacy plain-text values (e.g. "Edmonton, AB").
  }

  const parts = String(location).split(",").map((part) => part.trim());
  if (parts.length >= 2) {
    return {
      streetAddress: "",
      city: parts[0] || "",
      province: parts.slice(1).join(", ") || "",
      postalCode: "",
    };
  }

  return { streetAddress: "", city: String(location), province: "", postalCode: "" };
}

export function serializePatientAddress({ streetAddress, city, province, postalCode }) {
  const street = streetAddress?.trim() || "";
  const cityVal = city?.trim() || "";
  const provinceVal = province?.trim() || "";
  const postal = postalCode?.trim() || "";

  if (!street && !cityVal && !provinceVal && !postal) return null;

  return JSON.stringify({
    street,
    city: cityVal,
    province: provinceVal,
    postal,
  });
}

export function formatPatientAddress(location) {
  if (!location) return "--";

  const { streetAddress, city, province, postalCode } = parsePatientAddress(location);
  const formatted = [streetAddress, city, province, postalCode].filter(Boolean).join(", ");
  return formatted || location;
}

export async function updatePatientMetrics(
  patientId,
  { date_of_birth, height_cm, weight_kg, street_address, city, province, postal_code }
) {
  const { error } = await supabase
    .from("patient_profiles")
    .update({
      date_of_birth: date_of_birth || null,
      height_cm: height_cm ? parseInt(height_cm, 10) : null,
      weight_kg: weight_kg ? parseInt(weight_kg, 10) : null,
      location: serializePatientAddress({
        streetAddress: street_address,
        city,
        province,
        postalCode: postal_code,
      }),
    })
    .eq("id", patientId);
  if (error) throw error;
}

export async function getPatientProfile(patientId) {
  const { data, error } = await supabase
    .from("patient_profiles")
    .select("*, users!inner(email)")
    .eq("id", patientId)
    .maybeSingle();
  if (error) { console.error("getPatientProfile:", error.message); return {}; }
  return data || {};
}

// --- Symptoms (health_event - uses integer patientId) ---
const SEV_MAP = { mild: 2, moderate: 5, severe: 8 };

export async function createSymptom(patientId, symptom) {
  const now = new Date();
  const severity =
    typeof symptom.pain_scale === "number"
      ? symptom.pain_scale
      : SEV_MAP[symptom.severity] ?? 5;
  const { data, error } = await supabase
    .from("health_event")
    .insert({
      patient_id:  patientId,
      category_id: 1,
      event_title: symptom.name,
      event_type:  "symptom",
      date:        now.toISOString().slice(0, 10),
      time:        now.toTimeString().slice(0, 8),
      severity,
      notes:       symptom.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Medications (prescription table - uses UUID authId) ---
async function ensureMedicationCatalog(name) {
  const { data: existing } = await supabase
    .from("medication")
    .select("id")
    .ilike("medication_name", name)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("medication")
    .insert({ medication_name: name })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function createMedicationOnboarding(authId, med) {
  const medId = await ensureMedicationCatalog(med.name);
  const { data, error } = await supabase
    .from("prescription")
    .insert({
      patient_id:    authId,
      medication_id: medId,
      prescribed_by: med.prescribed_by || "",
      dose:          med.dosage || "",
      frequency:     med.frequency || "Once daily",
      status:        "active",
      start_date:    new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createMedication(authId, form) {
  const medId = await ensureMedicationCatalog(form.name);
  const { data, error } = await supabase
    .from("prescription")
    .insert({
      patient_id:    authId,
      medication_id: medId,
      prescribed_by: form.prescribed_by || "",
      dose:          form.dosage || "",
      frequency:     form.frequency || "Once daily",
      status:        "active",
      start_date:    new Date().toISOString().slice(0, 10),
    })
    .select("*, medication(medication_name)")
    .single();
  if (error) throw error;
  return mapPrescription(data);
}

function mapPrescription(row) {
  return {
    id:            row.id,
    name:          row.medication?.medication_name ?? "",
    dosage:        row.dose ?? "",
    frequency:     row.frequency ?? "",
    prescribed_by: row.prescribed_by ?? "",
    active:        row.status === "active",
    start_date:    row.start_date ?? row.created_at,
  };
}

export async function listMedications(authId) {
  const { data, error } = await supabase
    .from("prescription")
    .select("*, medication(medication_name)")
    .eq("patient_id", authId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapPrescription);
}

export async function deleteMedication(prescriptionId) {
  const { error } = await supabase
    .from("prescription")
    .delete()
    .eq("id", prescriptionId);
  if (error) throw error;
}

// --- Daily Doses (medication_log - uses UUID authId) ---
export async function todayDoses(authId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("medication_log")
    .select("*, prescription(dose, frequency, medication(medication_name))")
    .eq("patient_id", authId)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);
  if (error) throw error;
  return (data || []).map((d) => ({
    id:              d.id,
    medication_name: d.prescription?.medication?.medication_name ?? "\u2014",
    dosage:          d.prescription?.dose ?? "",
    frequency:       d.prescription?.frequency ?? "",
    taken:           d.status === "taken",
  }));
}

export async function toggleDose(logId, taken) {
  const { data, error } = await supabase
    .from("medication_log")
    .update({
      status:      taken ? "taken" : "pending",
      actual_time: taken ? new Date().toISOString() : null,
    })
    .eq("id", logId)
    .select()
    .single();
  if (error) throw error;
  return { ...data, taken: data.status === "taken" };
}

// --- Reports (uses integer patientId) ---
export async function listReports(patientId) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("patient_id", patientId)
    .order("generated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createReport(patientId, form) {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      patient_id:       patientId,
      title:            form.title,
      date_range_start: form.date_range_start,
      date_range_end:   form.date_range_end,
      sections:         form.sections,
      recipient:        form.recipient || "",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reportPreview(reportId, patientId, authId) {
  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();
  if (error) throw error;

  const sections = report.sections || [];
  let symptoms = [];
  let medications = [];

  if (sections.includes("symptoms")) {
    const { data } = await supabase
      .from("health_event")
      .select("*")
      .eq("patient_id", patientId)
      .gte("date", report.date_range_start)
      .lte("date", report.date_range_end)
      .order("date", { ascending: false });
    symptoms = (data || []).map((s) => ({
      id: s.id, logged_at: s.date, name: s.event_title,
      severity: s.severity, pain_scale: s.severity, notes: s.notes || "",
    }));
  }

  if (sections.includes("medications") && authId) {
    const { data } = await supabase
      .from("prescription")
      .select("*, medication(medication_name)")
      .eq("patient_id", authId)
      .order("created_at", { ascending: false });
    medications = (data || []).map((m) => ({
      id: m.id, name: m.medication?.medication_name ?? "",
      dosage: m.dose ?? "", frequency: m.frequency ?? "",
      prescribed_by: m.prescribed_by ?? "", active: m.status === "active", status: m.status,
    }));
  }

  const health_score = { score: 75, label: "Good" };
  return { report, health_score, symptoms, medications, allergies: [] };
}

export async function downloadReportPdf(reportId, patientId, authId) {
  try {
    const previewData = await reportPreview(reportId, patientId, authId);
    const patient = await getPatientProfile(patientId);
    const { generateHealthReportPdf } = await import("./reportPdfGenerator");
    generateHealthReportPdf({ ...previewData, patient });
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw err;
  }
}

export async function deleteReport(reportId) {
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId);
  if (error) throw error;
}

// --- Onboarding flag ---
export async function markUserOnboarded(userDbId) {
  const { error } = await supabase
    .from("users")
    .update({ onboarded: true })
    .eq("id", userDbId);
  if (error) throw error;
}
