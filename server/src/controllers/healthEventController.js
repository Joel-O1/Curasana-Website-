const prisma = require('../db');
const { symptomToUi, allergyToUi } = require('../utils/format');

async function findCategoryByName(name) {
  let cat = await prisma.category.findFirst({
    where: { category_name: name },
  });
  if (!cat) {
    cat = await prisma.category.findFirst({
      where: { category_name: 'Headache' },
    });
  }
  return cat;
}

const listSymptoms = async (req, res) => {
  try {
    const events = await prisma.health_event.findMany({
      where: { patient_id: req.patientId, event_type: 'symptom' },
      include: { category: true },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });
    res.json(events.map(symptomToUi));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createSymptom = async (req, res) => {
  try {
    const { symptom, location, severity, pain, notes } = req.body;
    const category = await findCategoryByName(symptom);

    if (!category) {
      return res.status(400).json({ message: 'No categories in database. Run db/seed.sql first.' });
    }

    const event = await prisma.health_event.create({
      data: {
        patient_id: req.patientId,
        category_id: category.id,
        event_title: symptom,
        event_type: 'symptom',
        severity: Number(pain) || 1,
        notes: notes || null,
        tags: JSON.stringify({
          type: 'symptom',
          location: location || 'General',
          severityLabel: severity || 'Mild',
        }),
      },
      include: { category: true },
    });

    res.status(201).json(symptomToUi(event));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteSymptom = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.health_event.findFirst({
      where: { id, patient_id: req.patientId, event_type: 'symptom' },
    });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await prisma.health_event.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const listAllergies = async (req, res) => {
  try {
    const events = await prisma.health_event.findMany({
      where: { patient_id: req.patientId, event_type: 'allergy' },
      orderBy: { created_at: 'desc' },
    });
    res.json(events.map(allergyToUi));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createAllergy = async (req, res) => {
  try {
    const { name, category, severity, reaction, diagnosed } = req.body;
    const cat = await findCategoryByName('Allergies');

    const event = await prisma.health_event.create({
      data: {
        patient_id: req.patientId,
        category_id: cat?.id || (await findCategoryByName('Headache')).id,
        event_title: name,
        event_type: 'allergy',
        notes: reaction || null,
        tags: JSON.stringify({
          type: 'allergy',
          category: category || 'Other',
          severityLabel: severity || 'Mild',
          reaction: reaction || '',
          diagnosed: diagnosed || '—',
        }),
      },
    });

    res.status(201).json(allergyToUi(event));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAllergy = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.health_event.findFirst({
      where: { id, patient_id: req.patientId, event_type: 'allergy' },
    });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await prisma.health_event.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  listSymptoms,
  createSymptom,
  deleteSymptom,
  listAllergies,
  createAllergy,
  deleteAllergy,
};
