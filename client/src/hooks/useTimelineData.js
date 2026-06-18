import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Maps DB rows into the shape HealthTimeline expects:
//   events:      { group: "Health Events", type, date: "YYYY-MM-DDTHH:mm", severity }
//   medications: { group: "Medications",   type, date: "YYYY-MM-DDTHH:mm", dose, note }

function toLocalStamp(dateStr, timeStr) {
  // health_event stores date ("2026-05-19") and time ("07:45:00+00") separately
  return `${dateStr}T${(timeStr || "00:00").slice(0, 5)}`;
}

export default function useTimelineData(patientId, userDbId) {
  const [events, setEvents] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId && !userDbId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const [heRes, mlRes] = await Promise.all([
        supabase
          .from("health_event")
          .select(`
            id,
            date,
            time,
            severity,
            event_title,
            category:category_id(category_name),
            health_event_fields!event_id(
              field_name,
              field_value
            )
          `) // 
          .eq("patient_id", patientId ?? -1)
          .order("date", { ascending: false })
          .order("time", { ascending: false }),

        supabase
          .from("medication_log")
          .select(`
            id,
            scheduled_time,
            actual_time,
            status,
            prescription:prescription_id(
              dose,
              unit,
              medication:medication_id(medication_name)
            )
          `)
          .eq("patient_id", userDbId ?? -1)
          .order("scheduled_time", { ascending: true }),
      ]);

      // console.log("DATABASE RAW RESPONSE:", heRes.data); //debug

      if (cancelled) return;

      if (heRes.error || mlRes.error) {
        setError(heRes.error?.message || mlRes.error?.message);
        setLoading(false);
        return;
      }

      setEvents(
        (heRes.data || [])
          // Removed the restrictive filter so rows are never wiped out
          .map((row) => {
            // Find the symptom field if it exists
            const fieldsArray = row.health_event_fields || [];
            const symptomField = fieldsArray.find(f => f.field_name === "Symptom Name");  
            
            // Safe fallback value for categories
            const categoryName = row.category?.category_name || "General Log";

            return {
              id: row.id,
              group: "Health Events",
              type: categoryName,
              event_title: row.event_title,
              
              // Smart primary label logic
              display_name: symptomField ? symptomField.field_value : (row.event_title || categoryName),
              sub_title: symptomField && row.event_title ? row.event_title : "",
              
              // Pass the raw array down for the expansion panel
              custom_fields: fieldsArray,
              
              date: toLocalStamp(row.date, row.time),
              severity: row.severity ?? 1,
            };
          })
      );

      setMedications(
        (mlRes.data || [])
          .filter((row) => row.prescription?.medication?.medication_name)
          .map((row) => {
            const stamp = row.actual_time || row.scheduled_time || "";
            const { dose, unit } = row.prescription;
            return {
              id: row.id,
              group: "Medications",
              type: row.prescription.medication.medication_name,
              date: stamp.slice(0, 16),
              dose: [dose, unit].filter(Boolean).join(" ") || "—",
              note: row.status ? `Status: ${row.status}` : "",
            };
          })
          .filter((row) => row.date)
      );

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [patientId, userDbId]);

  return { events, medications, loading, error };
}
