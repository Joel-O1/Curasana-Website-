const prisma = require('../db');
const { medToUi, parseTags } = require('../utils/format');

const COLORS = ['teal', 'purple', 'blue', 'pink', 'amber', 'coral'];

function parseDose(dosage) {
  if (!dosage) return { dose: null, unit: null };
  const match = String(dosage).match(/^([\d.]+)\s*(\w+)?$/);
  if (!match) return { dose: null, unit: dosage };
  return { dose: parseFloat(match[1]), unit: match[2] || null };
}

const list = async (req, res) => {
  try {
    const meds = await prisma.medication.findMany({
      where: { patient_id: req.patientId },
      include: { medication_log: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(meds.map((m) => medToUi(m, m.medication_log)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { name, dosage, frequency, prescribedBy, startDate, status, times } = req.body;
    const { dose, unit } = parseDose(dosage);
    const count = await prisma.medication.count({ where: { patient_id: req.patientId } });

    const med = await prisma.medication.create({
      data: {
        patient_id: req.patientId,
        medication_name: name,
        dose,
        unit,
        frequency: frequency || null,
        start_date: startDate ? new Date(startDate) : new Date(),
        status: status || 'Active',
        notes: JSON.stringify({
          prescribedBy: prescribedBy || '—',
          color: COLORS[count % COLORS.length],
          times: times || [],
          rawNotes: '',
        }),
      },
    });

    res.status(201).json(medToUi(med, []));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.medication.findFirst({
      where: { id, patient_id: req.patientId },
    });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await prisma.medication.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const logTaken = async (req, res) => {
  try {
    const medicationId = Number(req.params.id);
    const { taken } = req.body;

    const med = await prisma.medication.findFirst({
      where: { id: medicationId, patient_id: req.patientId },
    });
    if (!med) return res.status(404).json({ message: 'Not found' });

    if (taken) {
      await prisma.medication_log.create({
        data: {
          medication_id: medicationId,
          patient_id: req.patientId,
          status: 'taken',
          actual_time: new Date(),
        },
      });
    }

    res.json({ message: taken ? 'Logged as taken' : 'Updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { list, create, remove, logTaken };
