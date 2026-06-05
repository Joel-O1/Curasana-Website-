require('dotenv').config();

const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSeed() {
  const client = await pool.connect();

  try {
    console.log('--- Start Database Seeding ---');
    await client.query('BEGIN');

    // Clear dynamic data
    console.log('Truncating tables...');
    await client.query(`
      TRUNCATE 
        medication_log,
        prescription_history,
        prescription,
        medication,
        health_event_fields,
        health_event,
        appointment,
        patient_categories,
        patient_profiles,
        doctor_profiles,
        users
      RESTART IDENTITY CASCADE;
    `);

    // Load categories
    console.log('Loading categories...');
    const catRows = await client.query('SELECT id, category_name FROM category;');
    if (catRows.rows.length === 0) {
      throw new Error('No categories found. Make sure base seed.sql has run.');
    }
    const categoryMap = {};
    catRows.rows.forEach(r => {
      categoryMap[r.category_name] = r.id;
    });

    // Load field templates
    console.log('Loading category field templates...');
    const templateRows = await client.query(
      'SELECT id, category_id, field_name FROM category_field_templates;'
    );
    const templateMap = {};
    templateRows.rows.forEach(r => {
      const key = `${r.category_id}::${r.field_name}`;
      templateMap[key] = { id: r.id, field_name: r.field_name };
    });

    const getTemplate = (categoryName, fieldName) => {
      const catId = categoryMap[categoryName];
      if (!catId) throw new Error(`Category not found: ${categoryName}`);
      const key = `${catId}::${fieldName}`;
      const tpl = templateMap[key];
      if (!tpl) throw new Error(`Template field not found: [${categoryName}] -> "${fieldName}"`);
      return tpl;
    };

    const insertField = async (eventId, categoryName, fieldName, fieldValue) => {
      const tpl = getTemplate(categoryName, fieldName);
      await client.query(
        `INSERT INTO health_event_fields (event_id, template_field_id, field_name, field_value, is_custom)
         VALUES ($1, $2, $3, $4, false)`,
        [eventId, tpl.id, tpl.field_name, String(fieldValue)]
      );
    };

    // System medications
    console.log('Inserting system medications...');
    const SYSTEM_MEDICATIONS = [
      { name: 'Acetaminophen', description: 'Pain reliever / fever reducer', default_dose: '500', default_unit: 'mg' },
      { name: 'Ibuprofen', description: 'NSAID anti-inflammatory', default_dose: '200', default_unit: 'mg' },
      { name: 'Metformin', description: 'Type 2 diabetes medication', default_dose: '500', default_unit: 'mg' },
      { name: 'Lisinopril', description: 'Blood pressure medication', default_dose: '10', default_unit: 'mg' },
      { name: 'Atorvastatin', description: 'Cholesterol medication', default_dose: '20', default_unit: 'mg' }
    ];

    const systemMedIds = [];
    for (const med of SYSTEM_MEDICATIONS) {
      const res = await client.query(
        `INSERT INTO medication (medication_name, description, default_dose, default_unit)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [med.name, med.description, med.default_dose, med.default_unit]
      );
      systemMedIds.push(res.rows[0].id);
    }

    console.log('Generating users, profiles, and data...');
    let doctorCount = 0;
    let adminCount = 0;

    for (let i = 0; i < 30; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const username = faker.internet.username({ firstName, lastName });
      const email = faker.internet.email({ firstName, lastName });
      const passwordHash = await bcrypt.hash('password123', 10);

      let role = 'patient';
      if (doctorCount < 5 && i % 5 === 0) {
        role = 'doctor';
        doctorCount++;
      } else if (adminCount < 1 && i === 7) {
        role = 'admin';
        adminCount++;
      }

      const userRes = await client.query(
        `INSERT INTO users (username, email, role, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [username, email, role, passwordHash]
      );
      const userId = userRes.rows[0].id;

      // Doctor
      if (role === 'doctor') {
        await client.query(
          `INSERT INTO doctor_profiles (user_id, specialty, license_number)
           VALUES ($1, $2, $3)`,
          [
            userId,
            faker.helpers.arrayElement([
              'Internal Medicine',
              'Family Practice',
              'Cardiology',
              'Neurology',
              'General Practice'
            ]),
            `LIC-${faker.string.numeric(5)}`
          ]
        );
        continue;
      }

      // Admin
      if (role === 'admin') {
        continue;
      }

      // Patient
      const patientRes = await client.query(
        `INSERT INTO patient_profiles (user_id, first_name, last_name, date_of_birth)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          userId,
          firstName,
          lastName,
          faker.date.birthdate({ min: 18, max: 75, mode: 'age' })
        ]
      );
      const patientId = patientRes.rows[0].id;

      // Assign categories to patient (8–15)
      const shuffledCats = faker.helpers.shuffle([...catRows.rows]);
      const assignedCats = shuffledCats.slice(
        0,
        faker.number.int({ min: 8, max: 15 })
      );
      for (const cat of assignedCats) {
        await client.query(
          `INSERT INTO patient_categories (patient_id, category_id)
           VALUES ($1, $2)`,
          [patientId, cat.id]
        );
      }

      // Core categories we know how to seed events for
      const coreCategoryNames = [
        'Headache',
        'Fever',
        'Sleep',
        'Mood and Mental Health',
        'Stress'
      ].filter(name => categoryMap[name]);

      // Random subset of 3–5 core categories per patient (Option C)
      const shuffledCore = faker.helpers.shuffle(coreCategoryNames);
      const eventCategoryNames = shuffledCore.slice(
        0,
        Math.min(
          shuffledCore.length,
          faker.number.int({ min: 3, max: Math.min(5, shuffledCore.length || 3) })
        )
      );

      // ─────────────────────────────────────────
      // PRESCRIPTIONS (3 per patient)
      // ─────────────────────────────────────────
      const prescriptions = [];

      for (let p = 0; p < 3; p++) {
        // 20% chance of user-added medication
        let medId;
        if (faker.datatype.boolean(0.2)) {
          const customMedRes = await client.query(
            `INSERT INTO medication (medication_name, description, default_dose, default_unit, created_by_user_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
              faker.helpers.arrayElement([
                'Vitamin D3',
                'Omega-3 Fish Oil',
                'Herbal Supplement',
                'Probiotic Blend'
              ]),
              faker.lorem.sentence(),
              faker.number.int({ min: 50, max: 500 }).toString(),
              'mg',
              userId
            ]
          );
          medId = customMedRes.rows[0].id;
        } else {
          medId = faker.helpers.arrayElement(systemMedIds);
        }

        const dose = faker.number.int({ min: 50, max: 1000 }).toString();
        const unit = 'mg';
        const frequency = faker.helpers.arrayElement([
          'Once daily',
          'Twice daily',
          'Every 8 hours',
          'As needed'
        ]);
        const intakePeriods = faker.helpers.arrayElement([
          'morning',
          'night',
          'morning,night'
        ]);

        const presRes = await client.query(
          `INSERT INTO prescription (
              patient_id,
              medication_id,
              prescribed_by,
              dose,
              unit,
              frequency,
              daily_intake_periods,
              start_date,
              end_date,
              refills_remaining,
              status,
              notes
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11)
           RETURNING id`,
          [
            userId, // prescription.patient_id references users(id)
            medId,
            faker.helpers.arrayElement(['Self-managed', 'Clinic Provider', 'Nurse Practitioner']),
            dose,
            unit,
            frequency,
            intakePeriods,
            faker.date.recent({ days: 60 }),
            faker.date.soon({ days: 120 }),
            faker.number.int({ min: 0, max: 5 }),
            faker.lorem.sentence()
          ]
        );

        const prescriptionId = presRes.rows[0].id;
        prescriptions.push({ prescriptionId, medId });

        // Prescription history (0–3 entries)
        const historyCount = faker.number.int({ min: 0, max: 3 });
        for (let h = 0; h < historyCount; h++) {
          await client.query(
            `INSERT INTO prescription_history (
                prescription_id,
                changed_by_user_id,
                old_dose,
                old_unit,
                old_frequency,
                old_daily_intake_periods,
                old_start_date,
                old_end_date,
                old_refills_remaining,
                old_status,
                old_notes
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
              prescriptionId,
              userId,
              faker.number.int({ min: 50, max: 1000 }).toString(),
              'mg',
              faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Every 8 hours']),
              faker.helpers.arrayElement(['morning', 'night', 'morning,night']),
              faker.date.past({ years: 1 }),
              faker.date.recent({ days: 30 }),
              faker.number.int({ min: 0, max: 5 }),
              faker.helpers.arrayElement(['active', 'completed', 'cancelled']),
              faker.lorem.sentence()
            ]
          );
        }

        // Medication logs (14 days per prescription)
        for (let d = 0; d < 14; d++) {
          const scheduled = new Date();
          scheduled.setDate(scheduled.getDate() - d);
          scheduled.setHours(8, 0, 0, 0);

          const actual = new Date(scheduled);
          actual.setHours(
            scheduled.getHours() + faker.number.int({ min: -1, max: 3 })
          );

          await client.query(
            `INSERT INTO medication_log (
                prescription_id,
                patient_id,
                scheduled_time,
                actual_time,
                status,
                reason_missed,
                side_effects
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              prescriptionId,
              userId, // medication_log.patient_id references users(id)
              scheduled,
              actual,
              faker.helpers.arrayElement(['taken', 'taken', 'taken', 'missed', 'delayed', 'skipped']),
              faker.helpers.arrayElement([
                null,
                'Forgot',
                'Felt sick',
                'Out of medication',
                'Traveling'
              ]),
              faker.helpers.arrayElement([
                null,
                'Nausea',
                'Dizziness',
                'Fatigue',
                'Headache'
              ])
            ]
          );
        }
      }

      // Appointments (1–3 per patient)
      const apptDate = faker.date.soon({ days: 60 });
      const apptTime = faker.date.soon({ days: 60 });

      await client.query(
        `INSERT INTO appointment (
            patient_id,
            appt_type,
            provider_type,
            date,
            time,
            reason,
            notes,
            follow_up_required
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id`,
        [
          patientId,
          faker.helpers.arrayElement(['In-Person', 'Virtual', 'Phone']),
          faker.helpers.arrayElement(['GP', 'Specialist', 'Cardiologist', 'Neurologist']),
          apptDate.toISOString().split('T')[0], // YYYY-MM-DD
          apptTime.toISOString().split('T')[1].split('.')[0] + '+00', // HH:MM:SS+00
          faker.helpers.arrayElement([
            'Routine checkup',
            'Follow-up',
            'New symptoms',
            'Medication review'
          ]),
          faker.lorem.sentence(),
          faker.datatype.boolean()
        ]
      );
      const apptIds = [];
      const apptRes = await client.query(
        `SELECT id FROM appointment WHERE patient_id = $1`,
        [patientId]
      );
      apptRes.rows.forEach(r => apptIds.push(r.id));

      // Health events over past 14 days
      for (let day = 14; day >= 0; day--) {
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - day);
        const dateStr = eventDate.toISOString().split('T')[0];
        const timeStr = `${faker.number.int({ min: 6, max: 22 })}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}:00`;

        for (const catName of eventCategoryNames) {
          // Some categories less frequent
          if (catName === 'Fever' && day % 3 !== 0) continue;
          if (catName === 'Mood and Mental Health' && day % 2 !== 0) continue;
          if (catName === 'Stress' && day % 4 !== 0) continue;

          const categoryId = categoryMap[catName];
          if (!categoryId) continue;

          let eventTitle = 'Health Event';
          let severity = faker.number.int({ min: 1, max: 10 });
          let relatedMedicationId = null;
          let relatedApptId = null;

          if (catName === 'Headache') {
            eventTitle = 'Headache Episode';
          } else if (catName === 'Fever') {
            eventTitle = 'Fever Check';
            const anyPres = prescriptions.length
              ? faker.helpers.arrayElement(prescriptions)
              : null;
            relatedMedicationId = anyPres ? anyPres.medId : null;
          } else if (catName === 'Sleep') {
            eventTitle = 'Sleep Log';
            severity = faker.number.int({ min: 1, max: 5 });
          } else if (catName === 'Mood and Mental Health') {
            eventTitle = 'Daily Mood Check';
          } else if (catName === 'Stress') {
            eventTitle = 'Stress Log';
          }

          if (apptIds.length && faker.datatype.boolean(0.2)) {
            relatedApptId = faker.helpers.arrayElement(apptIds);
          }

          const eventRes = await client.query(
            `INSERT INTO health_event (
                patient_id,
                category_id,
                event_title,
                event_type,
                date,
                time,
                severity,
                notes,
                tags,
                related_medication_id,
                related_appt_id
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING id`,
            [
              patientId, // health_event.patient_id references patient_profiles(id)
              categoryId,
              eventTitle,
              null,
              dateStr,
              timeStr,
              severity,
              faker.lorem.sentence(),
              null,
              relatedMedicationId,
              relatedApptId
            ]
          );
          const eventId = eventRes.rows[0].id;

          // Insert fields per category
          if (catName === 'Headache') {
            await insertField(eventId, 'Headache', 'Symptom Name', 'Headache');
            await insertField(
              eventId,
              'Headache',
              'Severity',
              faker.number.int({ min: 1, max: 10 })
            );
            await insertField(
              eventId,
              'Headache',
              'Duration',
              faker.number.int({ min: 15, max: 240 })
            );
            await insertField(
              eventId,
              'Headache',
              'Body Location',
              faker.helpers.arrayElement([
                'temples',
                'forehead',
                'back of head',
                'behind eyes'
              ])
            );
            await insertField(
              eventId,
              'Headache',
              'Possible Trigger',
              faker.helpers.arrayElement([
                'stress',
                'dehydration',
                'poor sleep',
                'screen time'
              ])
            );
            await insertField(
              eventId,
              'Headache',
              'Medical Care Sought',
              faker.datatype.boolean()
            );
          } else if (catName === 'Fever') {
            await insertField(eventId, 'Fever', 'Symptom Name', 'Fever');
            await insertField(
              eventId,
              'Fever',
              'Severity',
              faker.number.int({ min: 1, max: 8 })
            );
            await insertField(
              eventId,
              'Fever',
              'Duration',
              faker.helpers.arrayElement(['1 day', '2 days', 'a few hours'])
            );
            await insertField(
              eventId,
              'Fever',
              'Medical Care Sought',
              faker.datatype.boolean()
            );
          } else if (catName === 'Sleep') {
            await insertField(
              eventId,
              'Sleep',
              'Duration',
              faker.number.float({ min: 4, max: 9, fractionDigits: 1 })
            );
            await insertField(
              eventId,
              'Sleep',
              'Quality Score',
              faker.number.int({ min: 1, max: 10 })
            );
            await insertField(
              eventId,
              'Sleep',
              'Disruptions',
              faker.helpers.arrayElement([
                'none',
                'woke up once',
                'restless',
                'woke up multiple times'
              ])
            );
          } else if (catName === 'Mood and Mental Health') {
            await insertField(
              eventId,
              'Mood and Mental Health',
              'Mood Rating',
              faker.number.int({ min: 1, max: 10 })
            );
            await insertField(
              eventId,
              'Mood and Mental Health',
              'Anxiety Level',
              faker.number.int({ min: 1, max: 10 })
            );
            await insertField(
              eventId,
              'Mood and Mental Health',
              'Triggers or Context',
              faker.helpers.arrayElement([
                'work stress',
                'family',
                'health concerns',
                'good day',
                'tired'
              ])
            );
          } else if (catName === 'Stress') {
            await insertField(
              eventId,
              'Stress',
              'Stress Level',
              faker.number.int({ min: 1, max: 10 })
            );
            await insertField(
              eventId,
              'Stress',
              'Primary Stressor',
              faker.helpers.arrayElement([
                'work',
                'finances',
                'relationships',
                'health',
                'school'
              ])
            );
            await insertField(
              eventId,
              'Stress',
              'Coping Strategies Tried',
              faker.helpers.arrayElement([
                'exercise',
                'meditation',
                'talking to someone',
                'rest',
                'none'
              ])
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('--- Seeding Complete! ---');
  } catch (err) {
    console.error('Seeding failed, rolling back...', err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
