const prisma = require('../db');
const { formatDate, formatTime, parseTags } = require('../utils/format');

const list = async (req, res) => {
  try {
    const [events, logs, appointments] = await Promise.all([
      prisma.health_event.findMany({
        where: { patient_id: req.patientId },
        include: { category: true },
        orderBy: [{ date: 'desc' }, { time: 'desc' }],
        take: 50,
      }),
      prisma.medication_log.findMany({
        where: { patient_id: req.patientId, status: 'taken' },
        include: { medication: true },
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
      prisma.appointment.findMany({
        where: { patient_id: req.patientId },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ]);

    const items = [];

    events.forEach((e) => {
      const meta = parseTags(e.tags);
      const isAllergy = e.event_type === 'allergy';
      items.push({
        date: formatDate(e.date),
        time: formatTime(e.time),
        type: isAllergy ? 'allergy' : 'symptom',
        title: isAllergy ? `${e.event_title} recorded` : `${e.event_title} logged`,
        detail: isAllergy
          ? `${meta.severityLabel || 'Mild'} · ${meta.reaction || e.notes || ''}`
          : `Severity ${e.severity}/10 · ${meta.location || 'General'}`,
        icon: isAllergy ? 'ti-alert-triangle' : 'ti-activity',
        color: isAllergy ? 'amber' : 'coral',
        sortKey: new Date(e.date).getTime(),
      });
    });

    logs.forEach((l) => {
      items.push({
        date: formatDate(l.created_at),
        time: formatTime(l.created_at),
        type: 'medication',
        title: `${l.medication.medication_name} taken`,
        detail: l.medication.dose ? `${l.medication.dose}${l.medication.unit || ''}` : 'Dose logged',
        icon: 'ti-pill',
        color: 'teal',
        sortKey: new Date(l.created_at).getTime(),
      });
    });

    appointments.forEach((a) => {
      items.push({
        date: formatDate(a.date),
        time: formatTime(a.time),
        type: 'appointment',
        title: a.appt_type || 'Appointment',
        detail: a.reason || a.provider_type || '',
        icon: 'ti-stethoscope',
        color: 'blue',
        sortKey: new Date(a.date).getTime(),
      });
    });

    items.sort((a, b) => b.sortKey - a.sortKey);
    res.json(items.map(({ sortKey, ...rest }) => rest));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { list };
