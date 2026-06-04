function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

function formatTime(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toTimeString().slice(0, 5);
}

function parseTags(tags) {
  if (!tags) return {};
  try {
    return JSON.parse(tags);
  } catch {
    return {};
  }
}

function symptomToUi(event) {
  const meta = parseTags(event.tags);
  return {
    id: event.id,
    date: formatDate(event.date),
    time: formatTime(event.time),
    symptom: event.event_title || event.category?.category_name || 'Symptom',
    location: meta.location || 'General',
    severity: meta.severityLabel || 'Mild',
    pain: event.severity ?? 1,
    notes: event.notes || '',
  };
}

function allergyToUi(event) {
  const meta = parseTags(event.tags);
  return {
    id: event.id,
    name: event.event_title || 'Unknown',
    category: meta.category || 'Other',
    severity: meta.severityLabel || 'Mild',
    reaction: meta.reaction || event.notes || '',
    diagnosed: meta.diagnosed || '—',
    icon: 'ti-alert-circle',
  };
}

function medToUi(med, logs = []) {
  const meta = parseTags(med.notes);
  const doseStr = med.dose != null ? `${med.dose}${med.unit || ''}` : '—';
  const todayLogs = logs.filter((l) => l.status === 'taken');
  return {
    id: med.id,
    name: med.medication_name,
    dosage: doseStr,
    frequency: med.frequency || '—',
    prescribedBy: meta.prescribedBy || '—',
    startDate: formatDate(med.start_date),
    status: med.status || 'Active',
    color: meta.color || 'teal',
    times: meta.times || [],
    taken: meta.times ? meta.times.map((_, i) => todayLogs.some((l) => l.scheduled_time)) : [],
    notes: meta.rawNotes || '',
  };
}

module.exports = {
  formatDate,
  formatTime,
  parseTags,
  symptomToUi,
  allergyToUi,
  medToUi,
};
