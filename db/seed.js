require('dotenv').config();


const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

// Configure Local PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSeed() {
  const client = await pool.connect();

  try {
    console.log('--- Start Database Seeding ---');
    await client.query('BEGIN');

    // Clear old dynamic records, preserve categories and templates
    console.log('Cleaning old dynamic records...');
    await client.query(`
      TRUNCATE 
        medication_log, health_event_fields, health_event,
        appointment, medication, patient_categories,
        patient_profiles, doctor_profiles, users
      RESTART IDENTITY CASCADE;
    `);

    // Load existing categories
    console.log('Loading categories from database...');
    const catRows = await client.query('SELECT id, category_name FROM category;');
    if (catRows.rows.length === 0) {
      throw new Error('No categories found. Please run seed.sql first.');
    }
    const categoryMap = {};
    catRows.rows.forEach(r => { categoryMap[r.category_name] = r.id; });

    // Load field templates — map by category_id + field_name for precise lookup
    console.log('Loading field templates...');
    const templateRows = await client.query('SELECT id, category_id, field_name FROM category_field_templates;');
    const templateMap = {};
    templateRows.rows.forEach(r => {
      const key = `${r.category_id}::${r.field_name}`;
      templateMap[key] = r.id;
    });

    // Helper to get template_field_id safely
    const getTemplateId = (categoryName, fieldName) => {
      const catId = categoryMap[categoryName];
      const key = `${catId}::${fieldName}`;
      const id = templateMap[key];
      if (!id) throw new Error(`Template field not found: [${categoryName}] -> "${fieldName}"`);
      return id;
    };

    // Helper to insert a health_event_field row
    const insertField = async (eventId, categoryName, fieldName, fieldValue) => {
      const templateFieldId = getTemplateId(categoryName, fieldName);
      await client.query(
        `INSERT INTO health_event_fields (event_id, template_field_id, field_value, is_custom)
         VALUES ($1, $2, $3, false)`,
        [eventId, templateFieldId, String(fieldValue)]
      );
    };

    let doctorCount = 0;
    let adminCount  = 0;

    console.log('Generating users...');
    for (let i = 0; i < 30; i++) {
      const firstName = faker.person.firstName();
      const lastName  = faker.person.lastName();
      const username  = faker.internet.username({ firstName, lastName });
      const email     = faker.internet.email({ firstName, lastName });
      const passwordHash  = await bcrypt.hash('password123', 10); // default password for all users

      // Distribute roles: 5 doctors, 1 admin, 24 patients
      let role = 'patient';
      if (doctorCount < 5 && i % 5 === 0) {
        role = 'doctor';
        doctorCount++;
      } else if (adminCount < 1 && i === 7) {
        role = 'admin';
        adminCount++;
      }

      const userRes = await client.query(
        `INSERT INTO users (username, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`,
        [username, email, role, passwordHash]
      );
      const userId = userRes.rows[0].id;
       

      // ── DOCTOR ──────────────────────────────────────────────────────────────
      if (role === 'doctor') {
        await client.query(
          `INSERT INTO doctor_profiles (user_id, specialty, license_number) VALUES ($1, $2, $3)`,
          [
            userId,
            faker.helpers.arrayElement(['Internal Medicine', 'Family Practice', 'Cardiology', 'Neurology', 'General Practice']),
            `LIC-${faker.string.numeric(5)}`
          ]
        );
        continue; // doctors have no health events in this seed
      }

      // ── ADMIN ───────────────────────────────────────────────────────────────
      if (role === 'admin') {
        continue; // admins have no profile or health data
      }

      // ── PATIENT ─────────────────────────────────────────────────────────────
      const patientRes = await client.query(
        `INSERT INTO patient_profiles (user_id, first_name, last_name, date_of_birth)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [userId, firstName, lastName, faker.date.birthdate({ min: 18, max: 75, mode: 'age' })]
      );
      const patientId = patientRes.rows[0].id;

      // Assign a random subset of categories to this patient (8-15 categories)
      const shuffledCats = faker.helpers.shuffle([...catRows.rows]);
      const assignedCats = shuffledCats.slice(0, faker.number.int({ min: 8, max: 15 }));
      for (const cat of assignedCats) {
        await client.query(
          `INSERT INTO patient_categories (patient_id, category_id) VALUES ($1, $2)`,
          [patientId, cat.id]
        );
      }

      // ── MEDICATION ──────────────────────────────────────────────────────────
      const medName = faker.helpers.arrayElement(['Acetaminophen', 'Ibuprofen', 'Metformin', 'Lisinopril', 'Atorvastatin']);
      const medRes = await client.query(
        `INSERT INTO medication (patient_id, medication_name, dose, unit, frequency, start_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING id`,
        [patientId, medName, faker.number.int({ min: 100, max: 1000 }), 'mg',
         faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Every 8 hours', 'As needed']),
         faker.date.recent({ days: 60})]
      );
      const medId = medRes.rows[0].id;

      // ── APPOINTMENT ─────────────────────────────────────────────────────────
      const apptRes = await client.query(
        `INSERT INTO appointment (patient_id, appt_type, provider_type, date, reason)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          patientId,
          faker.helpers.arrayElement(['In-Person', 'Virtual', 'Phone']),
          faker.helpers.arrayElement(['GP', 'Specialist', 'Cardiologist', 'Neurologist']),
          faker.date.soon({ days: 30 }),
          faker.helpers.arrayElement(['Routine checkup', 'Follow-up', 'New symptoms', 'Medication review'])
        ]
      );
      const apptId = apptRes.rows[0].id;

      // ── HEALTH EVENTS — past 14 days ─────────────────────────────────────
      for (let day = 14; day >= 0; day--) {
        const eventDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
        const dateStr   = eventDate.toISOString().split('T')[0];
        const timeStr   = `${faker.number.int({ min: 6, max: 22 })}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}:00`;

        // ── HEADACHE EVENT ────────────────────────────────────────────────
        if (categoryMap['Headache']) {
          const headacheRes = await client.query(
            `INSERT INTO health_event (patient_id, category_id, event_title, severity, notes, date, time)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [patientId, categoryMap['Headache'], 'Headache Episode',
             faker.number.int({ min: 1, max: 10 }), faker.lorem.sentence(), dateStr, timeStr]
          );
          const headacheId = headacheRes.rows[0].id;

          await insertField(headacheId, 'Headache', 'Symptom Name',          'Headache');
          await insertField(headacheId, 'Headache', 'Severity',               faker.number.int({ min: 1, max: 10 }));
          await insertField(headacheId, 'Headache', 'Duration',               faker.number.int({ min: 15, max: 240 }));
          await insertField(headacheId, 'Headache', 'Body Location',          faker.helpers.arrayElement(['temples', 'forehead', 'back of head', 'behind eyes']));
          await insertField(headacheId, 'Headache', 'Possible Trigger',       faker.helpers.arrayElement(['stress', 'dehydration', 'poor sleep', 'screen time']));
          await insertField(headacheId, 'Headache', 'Medical Care Sought',    faker.datatype.boolean());
        }

        // ── FEVER EVENT ───────────────────────────────────────────────────
        if (categoryMap['Fever'] && day % 3 === 0) {
          const feverRes = await client.query(
            `INSERT INTO health_event (patient_id, category_id, event_title, severity, date, time, related_medication_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [patientId, categoryMap['Fever'], 'Fever Check',
             faker.number.int({ min: 1, max: 8 }), dateStr, timeStr, medId]
          );
          const feverId = feverRes.rows[0].id;

          await insertField(feverId, 'Fever', 'Symptom Name',        'Fever');
          await insertField(feverId, 'Fever', 'Severity',             faker.number.int({ min: 1, max: 8 }));
          await insertField(feverId, 'Fever', 'Duration',             faker.helpers.arrayElement(['1 day', '2 days', 'a few hours']));
          await insertField(feverId, 'Fever', 'Medical Care Sought',  faker.datatype.boolean());

          // medication log entry linked to this fever event
          await client.query(
            `INSERT INTO medication_log (medication_id, patient_id, health_event_id, scheduled_time, actual_time, status)
             VALUES ($1, $2, $3, '08:00:00', $4, $5)`,
            [medId, patientId, feverId, timeStr,
             faker.helpers.arrayElement(['taken', 'taken', 'taken', 'missed', 'delayed'])]
          );
        }

        // ── SLEEP EVENT ───────────────────────────────────────────────────
        if (categoryMap['Sleep']) {
          const sleepRes = await client.query(
            `INSERT INTO health_event (patient_id, category_id, event_title, severity, date, time)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [patientId, categoryMap['Sleep'], 'Sleep Log',
             faker.number.int({ min: 1, max: 5 }), dateStr, '07:00:00']
          );
          const sleepId = sleepRes.rows[0].id;

          await insertField(sleepId, 'Sleep', 'Duration',      faker.number.float({ min: 4, max: 9, fractionDigits: 1 }));
          await insertField(sleepId, 'Sleep', 'Quality Score', faker.number.int({ min: 1, max: 10 }));
          await insertField(sleepId, 'Sleep', 'Disruptions',   faker.helpers.arrayElement(['none', 'woke up once', 'restless', 'woke up multiple times']));
        }

        // ── MOOD EVENT ────────────────────────────────────────────────────
        if (categoryMap['Mood and Mental Health'] && day % 2 === 0) {
          const moodRes = await client.query(
            `INSERT INTO health_event (patient_id, category_id, event_title, severity, date, time)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [patientId, categoryMap['Mood and Mental Health'], 'Daily Mood Check',
             faker.number.int({ min: 1, max: 10 }), dateStr, '20:00:00']
          );
          const moodId = moodRes.rows[0].id;

          await insertField(moodId, 'Mood and Mental Health', 'Mood Rating',        faker.number.int({ min: 1, max: 10 }));
          await insertField(moodId, 'Mood and Mental Health', 'Anxiety Level',      faker.number.int({ min: 1, max: 10 }));
          await insertField(moodId, 'Mood and Mental Health', 'Triggers or Context', faker.helpers.arrayElement(['work stress', 'family', 'health concerns', 'good day', 'tired']));
        }

        // ── STRESS EVENT ──────────────────────────────────────────────────
        if (categoryMap['Stress'] && day % 4 === 0) {
          const stressRes = await client.query(
            `INSERT INTO health_event (patient_id, category_id, event_title, severity, date, time)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [patientId, categoryMap['Stress'], 'Stress Log',
             faker.number.int({ min: 1, max: 10 }), dateStr, timeStr]
          );
          const stressId = stressRes.rows[0].id;

          await insertField(stressId, 'Stress', 'Stress Level',            faker.number.int({ min: 1, max: 10 }));
          await insertField(stressId, 'Stress', 'Primary Stressor',        faker.helpers.arrayElement(['work', 'finances', 'relationships', 'health', 'school']));
          await insertField(stressId, 'Stress', 'Coping Strategies Tried', faker.helpers.arrayElement(['exercise', 'meditation', 'talking to someone', 'rest', 'none']));
        }
      }

      // ── STANDALONE MEDICATION LOG (no health event) ───────────────────
      for (let d = 0; d < 7; d++) {
        const logTime = `${faker.number.int({ min: 7, max: 21 })}:00:00`;
        await client.query(
          `INSERT INTO medication_log (medication_id, patient_id, scheduled_time, actual_time, status)
           VALUES ($1, $2, '08:00:00', $3, $4)`,
          [medId, patientId, logTime,
           faker.helpers.arrayElement(['taken', 'taken', 'taken', 'missed', 'delayed', 'skipped'])]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`--- Seeding Complete! 24 Patients, 5 Doctors, 1 Admin ---`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed. Transaction rolled back.', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();