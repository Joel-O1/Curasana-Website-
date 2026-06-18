require('dotenv').config();

const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const generateUUID = () => faker.string.uuid();

async function runSeed() {
  const client = await pool.connect();

  try {
    console.log('--- Start Ultra-Deep High-Variation Seeding ---');
    await client.query('BEGIN');

    console.log('Truncating dynamic data tables...');
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
        public.users
      RESTART IDENTITY CASCADE;
    `);

    console.log('Cleaning up historical seed entries from Supabase auth.users...');
    await client.query(`
      DELETE FROM auth.users 
      WHERE email LIKE '%@example.com' OR email LIKE '%@example.org';
    `);

    console.log('Loading categories linked by SQL file...');
    const catRows = await client.query('SELECT id, category_name FROM category;');
    if (catRows.rows.length === 0) {
      throw new Error('No categories found. Run your base SQL seed file first.');
    }
    
    const categoryMap = {};
    catRows.rows.forEach(r => {
      categoryMap[r.category_name] = r.id;
    });

    console.log('Loading field templates map...');
    const templateRows = await client.query('SELECT id, category_id, field_name FROM category_field_templates;');
    const templateMap = {};
    templateRows.rows.forEach(r => {
      const key = `${r.category_id}::${r.field_name.toLowerCase().trim()}`;
      templateMap[key] = { id: r.id, field_name: r.field_name };
    });

    const insertFieldIfExists = async (eventId, categoryName, fieldName, fieldValue) => {
      const catId = categoryMap[categoryName];
      if (!catId) return;
      const key = `${catId}::${fieldName.toLowerCase().trim()}`;
      const tpl = templateMap[key];
      
      if (tpl) {
        await client.query(
          `INSERT INTO health_event_fields (event_id, template_field_id, field_name, field_value, is_custom)
           VALUES ($1, $2, $3, $4, false)`,
          [eventId, tpl.id, tpl.field_name, String(fieldValue)]
        );
      }
    };

    // --- GENERATE COMPLETELY VARIANT MASTER DRUG POOL ---
    console.log('Generating customized medication registry pool...');
    const drugPrefixes = ['Atorva', 'Lisinop', 'Amoxi', 'Metfor', 'Omepra', 'Sertra', 'Gabapen', 'Alpraz', 'Hydrochloroth', 'Simva', 'Levothyrox', 'Losar'];
    const drugSuffixes = ['statin', 'ril', 'cillin', 'min', 'zole', 'line', 'tin', 'olam', 'iazide', 'ine', 'sodium', 'tan'];
    const medicalDescriptions = ['HMG-CoA reductase inhibitor', 'ACE Inhibitor target', 'Broad-spectrum antibiotic agent', 'Biguanide antihyperglycemic', 'Proton pump inhibitor', 'Selective serotonin reuptake inhibitor', 'Gamma-aminobutyric acid analog', 'Benzodiazepine class', 'Thiazide diuretic', 'Thyroid hormone replacement', 'Angiotensin II receptor antagonist'];

    const systemMedIds = [];
    for (let m = 0; m < 20; m++) {
      const name = faker.helpers.arrayElement(drugPrefixes) + faker.helpers.arrayElement(drugSuffixes);
      const description = faker.helpers.arrayElement(medicalDescriptions) + ' for clinical management profiles.';
      const dose = faker.helpers.arrayElement(['5', '10', '20', '50', '100', '250', '500', '850']);
      const unit = faker.helpers.arrayElement(['mg', 'mcg', 'ml', 'mg/ml', 'IU']);
      const freq = faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Three times daily', 'Every 4-6 hours as needed', 'Every 12 hours', 'Before meals']);
      const period = faker.helpers.arrayElement(['morning', 'noon', 'evening', 'night', 'as_needed']);

      const res = await client.query(
        `INSERT INTO medication (medication_name, description, default_dose, default_unit)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [name, description, dose, unit]
      );
      systemMedIds.push({ id: res.rows[0].id, name, description, dose, unit, freq, period });
    }

    // --- BASE META LISTS ---
    const APPT_TYPES = ['In-Person Clinic Visit', 'Video Telehealth Portal', 'Urgent Audio Consult', 'Specialist Diagnostic Review', 'Annual Physical Lab Check'];
    const PROVIDER_TYPES = ['GP', 'Cardiologist', 'Neurologist', 'Gastroenterologist', 'Psychiatrist', 'Dermatologist', 'Rheumatologist', 'Endocrinologist'];
    const SUPABASE_PASSWORD_HASH = '$2b$10$0V7g7E66P8KBlbX8M8deqWOnf1S13h3BvI8h538H6B9Z89S.rPCee'; // password123

    console.log('Generating 30 highly variant user entities and deep timelines...');
    let doctorCount = 0;
    let adminCount = 0;

    // --- LOOK UP REAL INSTANCE ID ---
    console.log('Fetching live Supabase instance ID...');
    const instanceRes = await client.query('SELECT instance_id FROM auth.users LIMIT 1;');
    
    // Fallback to zeros if it's a completely fresh instance with zero historic users
    const REAL_INSTANCE_ID = (instanceRes.rows.length > 0 && instanceRes.rows[0].instance_id) 
      ? instanceRes.rows[0].instance_id 
      : '00000000-0000-0000-0000-000000000000';
    
    console.log(`Using Instance ID: ${REAL_INSTANCE_ID}`);

    for (let i = 0; i < 30; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}_${faker.string.numeric(2)}@example.com`;
      const userUuid = generateUUID();

      let role = 'patient';
      if (doctorCount < 5 && i % 5 === 0) {
        role = 'doctor';
        doctorCount++;
      } else if (adminCount < 1 && i === 7) {
        role = 'admin';
        adminCount++;
      }

      // ======================================================================
      // Step A: Fully Hydrated Supabase Core Auth Scheme Registry
      // ======================================================================
      // Step A: Supabase Core Auth Scheme Registry with Dynamic Hashing
      const username = `${firstName} ${lastName}`.trim();
      const rawUserMetaData = JSON.stringify({
        username: username,
        first_name: firstName,
        last_name: lastName,
        name: username,
        full_name: username
      });

      await client.query(
        `INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
          recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
          created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
         ) VALUES (
          '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, 
          extensions.crypt('password123', extensions.gen_salt('bf', 10)), -- <--- Dynamic Crypto Gen
          NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, 
          NOW(), NOW(), '', '', '', ''
         );`,
        [userUuid, email, rawUserMetaData] // Removed SUPABASE_PASSWORD_HASH from parameter array
      );

      // ======================================================================
      // Step B: Supabase Core Identity Mapping
      // ======================================================================
      const identityDataJson = JSON.stringify({ 
        sub: userUuid, 
        email: email,
        email_verified: true 
      });
      
      await client.query(
        `INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, 'email', $4, NOW(), NOW(), NOW());`,
        [userUuid, userUuid, identityDataJson, userUuid]
      );

      // ==========================================
      // Step C: Trigger-Aware Public User Sync
      // ==========================================
      // The database trigger fires the exact millisecond Step A executes.
      // We look up the newly synced row using the userUuid string.
      const userRes = await client.query(
        `UPDATE public.users 
         SET role = $1, onboarded = true 
         WHERE id = $2 
         RETURNING id`,
        [role, userUuid]
      );
      
      let publicUserId = userRes.rows.length > 0 ? userRes.rows[0].id : null;
      
      // Fallback: If the trigger was disabled or missed it, insert manually
      if (!publicUserId) {
        const insertRes = await client.query(
          `INSERT INTO public.users (id, email, role, onboarded) 
           VALUES ($1, $2, $3, true) 
           ON CONFLICT (id) DO UPDATE SET role = $3, onboarded = true
           RETURNING id`,
          [userUuid, email, role]
        );
        publicUserId = insertRes.rows[0].id;
      }

      // Route Doctor profiles out of the Patient workflow cleanly
      if (role === 'doctor') {
        await client.query(
          `INSERT INTO doctor_profiles (user_id, specialty, license_number) VALUES ($1, $2, $3)`,
          [publicUserId, faker.helpers.arrayElement(PROVIDER_TYPES), `LIC-${faker.string.numeric(5)}`]
        );
        continue; // Move to next user in the loop
      }
      if (role === 'admin') continue;

      // ==========================================
      // Step D: Patient Biometrics Randomization
      // ==========================================
      // The database trigger already initialized a profile for this userUuid.
      // We target the existing record via user_id = $1 to update it with random biometrics.
      let patientId;
      const profileData = [
        userUuid, // $1 (Targets the user UUID string)
        firstName, // $2
        lastName, // $3
        faker.date.birthdate({ min: 18, max: 76, mode: 'age' }), // $4
        faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']), // $5
        faker.number.int({ min: 148, max: 202 }), // $6
        faker.number.int({ min: 48, max: 125 }), // $7
        faker.helpers.arrayElement(['Edmonton, AB', 'Sherwood Park, AB', 'St. Albert, AB', 'Leduc, AB', 'Spruce Grove, AB']) // $8
      ];

      const profileUpdateRes = await client.query(
        `UPDATE public.patient_profiles 
         SET first_name = $2, last_name = $3, date_of_birth = $4, blood_type = $5, height_cm = $6, weight_kg = $7, location = $8 
         WHERE user_id = $1 
         RETURNING id`,
        profileData
      );
      
      if (profileUpdateRes.rows.length > 0) {
        patientId = profileUpdateRes.rows[0].id;
      } else {
        // Safe fallback insertion if the trigger didn't catch it
        const profileInsertRes = await client.query(
          `INSERT INTO public.patient_profiles (user_id, first_name, last_name, date_of_birth, blood_type, height_cm, weight_kg, location) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           RETURNING id`,
          profileData
        );
        patientId = profileInsertRes.rows[0].id;
      }

      // Assign dynamic selection of categories per patient profile mapping
      const shuffledCats = faker.helpers.shuffle([...catRows.rows]);
      const assignedCats = shuffledCats.slice(0, faker.number.int({ min: 16, max: 26 }));
      for (const cat of assignedCats) {
        await client.query(
          `INSERT INTO patient_categories (patient_id, category_id) 
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`, 
          [patientId, cat.id]
        );
      }

      // Step E: Customized Prescriptions Matrix Mapping
      const selectedMeds = faker.helpers.shuffle([...systemMedIds]).slice(0, faker.number.int({ min: 2, max: 5 }));
      const patientPrescriptions = [];

      for (const med of selectedMeds) {
        const customDose = String(parseInt(med.dose) * faker.helpers.arrayElement([0.5, 1, 2])); // Varied execution multiplier
        const presRes = await client.query(
          `INSERT INTO prescription (patient_id, medication_id, prescribed_by, dose, unit, frequency, daily_intake_periods, start_date, end_date, refills_remaining, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active') RETURNING id`,
          [
            publicUserId, med.id, 
            `Dr. ${faker.person.lastName()}, MD`, 
            customDose, med.unit, med.freq, med.period,
            faker.date.recent({ days: 60 }), faker.date.soon({ days: 120 }), 
            faker.number.int({ min: 0, max: 6 })
          ]
        );
        const prescriptionId = presRes.rows[0].id;
        patientPrescriptions.push({ prescriptionId, medId: med.id, name: med.name });

        // Generate 30 days of compliance logs with random, varied delays
        for (let d = 0; d < 30; d++) {
          const scheduled = new Date();
          scheduled.setDate(scheduled.getDate() - d);
          
          let hourBase = med.period === 'morning' ? 8 : med.period === 'noon' ? 12 : med.period === 'evening' ? 17 : med.period === 'night' ? 22 : 10;
          scheduled.setHours(hourBase, 0, 0, 0);

          const actualTime = new Date(scheduled);
          actualTime.setMinutes(faker.number.int({ min: -20, max: 120 })); // Time adherence drift

          await client.query(
            `INSERT INTO medication_log (prescription_id, patient_id, scheduled_time, actual_time, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              prescriptionId, publicUserId, scheduled, actualTime,
              faker.helpers.arrayElement(['taken', 'taken', 'taken', 'taken', 'taken', 'missed', 'skipped']) // Scattered compliance baseline
            ]
          );
        }
      }

      // Step F: Dynamic Appointment Seed Matrix
      const apptCount = faker.number.int({ min: 2, max: 5 });
      for (let a = 0; a < apptCount; a++) {
        await client.query(
          `INSERT INTO appointment (patient_id, appt_type, provider_type, date, reason, follow_up_required)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            patientId, 
            faker.helpers.arrayElement(APPT_TYPES), 
            faker.helpers.arrayElement(PROVIDER_TYPES), 
            faker.date.between({ from: faker.date.recent({ days: 30 }), to: faker.date.soon({ days: 30 }) }).toISOString().split('T')[0], 
            faker.lorem.words({ min: 3, max: 6 }),
            faker.datatype.boolean(0.3)
          ]
        );
      }

      // Step G: Deep Health Event Hydrator (5 to 30 Entries Per User, 100% Unique Mapping Across All 18 Target Types)
      const totalEventsToGenerate = faker.number.int({ min: 5, max: 30 });

      for (let e = 0; e < totalEventsToGenerate; e++) {
        const randomDayOffset = faker.number.int({ min: 0, max: 45 });
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - randomDayOffset);
        
        const dateStr = eventDate.toISOString().split('T')[0];
        const timeStr = `${String(faker.number.int({ min: 5, max: 23 })).padStart(2, '0')}:${String(faker.number.int({ min: 0, max: 59 })).padStart(2, '0')}:00`;

        const selectedCat = faker.helpers.arrayElement(assignedCats);
        const catName = selectedCat.category_name;

        const contextualMed = faker.datatype.boolean(0.4) && patientPrescriptions.length > 0
          ? faker.helpers.arrayElement(patientPrescriptions).medId 
          : null;

        const severityValue = faker.number.int({ min: 1, max: 10 });

        const eventRes = await client.query(
          `INSERT INTO health_event (patient_id, category_id, event_title, date, time, severity, notes, related_medication_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            patientId, selectedCat.id, 
            `${catName} Observation Log`, 
            dateStr, timeStr, severityValue, 
            faker.lorem.paragraph(1), 
            contextualMed
          ]
        );
        const eventId = eventRes.rows[0].id;

        // MULTI-FIELD EXHAUSTIVE SEED HYDRATOR FOR ALL COLUMN TEMPLATES
        if (catName === 'Headache') {
          await insertFieldIfExists(eventId, catName, 'Symptom Name', 'Headache');
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Duration', faker.number.int({ min: 15, max: 480 }));
          await insertFieldIfExists(eventId, catName, 'Body Location', faker.helpers.arrayElement(['Bilateral Temporal', 'Frontal Pressure Cluster', 'Left Ocular Base', 'Generalized Migraine']));
          await insertFieldIfExists(eventId, catName, 'Possible Trigger', faker.helpers.arrayElement(['Dehydration', 'Extended screen usage', 'Sudden atmospheric drops', 'Caffeine latency']));
          await insertFieldIfExists(eventId, catName, 'Associated Symptoms', faker.helpers.arrayElement(['Mild light sensitivity', 'Nausea aura', 'Visual blind spot flash', 'None']));
          await insertFieldIfExists(eventId, catName, 'What Helped', faker.helpers.arrayElement(['Ice wrap application', 'Prescription NSAID intake', 'Dark room isolation isolation']));
          await insertFieldIfExists(eventId, catName, 'What Made It Worse', 'Loud environmental sounds');
          await insertFieldIfExists(eventId, catName, 'Medical Care Sought', severityValue >= 8);
        } 
        else if (catName === 'Cough') {
          await insertFieldIfExists(eventId, catName, 'Symptom Name', 'Cough');
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Duration', `${faker.number.int({ min: 1, max: 14 })} days`);
          await insertFieldIfExists(eventId, catName, 'Medical Care Sought', severityValue > 7);
        } 
        else if (catName === 'Fever') {
          await insertFieldIfExists(eventId, catName, 'Symptom Name', 'Fever');
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Duration', `${faker.number.int({ min: 2, max: 72 })} hours`);
          await insertFieldIfExists(eventId, catName, 'Medical Care Sought', severityValue >= 8);
        } 
        else if (catName === 'Sleep') {
          await insertFieldIfExists(eventId, catName, 'Duration', faker.number.float({ min: 3.5, max: 10.5, fractionDigits: 1 }));
          await insertFieldIfExists(eventId, catName, 'Quality Score', severityValue);
          await insertFieldIfExists(eventId, catName, 'Disruptions', faker.helpers.arrayElement(['Zero awakenings', 'Woke up twice to drink water', 'Intermittent restless heart racing']));
        } 
        else if (catName === 'Mood and Mental Health') {
          await insertFieldIfExists(eventId, catName, 'Mood Rating', severityValue);
          await insertFieldIfExists(eventId, catName, 'Anxiety Level', faker.number.int({ min: 1, max: 10 }));
        } 
        else if (catName === 'Stress') {
          await insertFieldIfExists(eventId, catName, 'Stress Level', severityValue);
          await insertFieldIfExists(eventId, catName, 'Primary Stressor', faker.helpers.arrayElement(['Project Deployment Targets', 'Complex Family Commitments', 'Financial Forecast Variance', 'Academic Exam Infrastructure']));
        } 
        else if (catName === 'Fatigue') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Duration', faker.helpers.arrayElement(['Morning onset failure', 'Persistent mid-afternoon crashing', 'Total exhaustion cycle']));
        } 
        else if (catName === 'Dizziness') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Possible Trigger', faker.helpers.arrayElement(['Orthostatic hypotension (standing)', 'Vertigo inner ear shift', 'Dehydration cascade']));
        } 
        else if (catName === 'Nausea') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Possible Trigger', faker.helpers.arrayElement(['Empty stomach processing', 'Food item flavor profile repulsion', 'Motion tracking disruption']));
        } 
        else if (catName === 'Vomiting') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Medical Care Sought', severityValue > 5);
        } 
        else if (catName === 'Diarrhea') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
        } 
        else if (catName === 'Shortness of Breath') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Possible Trigger', faker.helpers.arrayElement(['Rapid stairs climbing flight', 'Cold dry outdoor air intake', 'Asthma chronic flare']));
        } 
        else if (catName === 'Chest Discomfort') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Medical Care Sought', true); // Emergency bypass
        } 
        else if (catName === 'Joint Pain') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Body Location', faker.helpers.arrayElement(['Right Patella Joint', 'Left Shoulder Rotator Cuff', 'Carpal Wrist Segment', 'Lower Vertebrae Core']));
        } 
        else if (catName === 'Anxiety') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Possible Trigger', faker.helpers.arrayElement(['Social Presentation Event', 'Unscheduled Status Updates', 'Panic Trigger Overstimulation']));
        } 
        else if (catName === 'Diet') {
          await insertFieldIfExists(eventId, catName, 'Meals Logged', faker.helpers.arrayElement(['High Fiber Whole Oats + Berry Mix', 'Lean Sirloin Beef + Avocado + Spinach Bowl', 'Processed Sodium Fast Food Meals']));
          await insertFieldIfExists(eventId, catName, 'Hydration Intake', faker.number.int({ min: 500, max: 4500 }));
        } 
        else if (catName === 'Physical Activity') {
          await insertFieldIfExists(eventId, catName, 'Workout Type', faker.helpers.arrayElement(['Zone 2 Aerobic Running Session', 'High-Intensity Calisthenics Routine', 'Deadlift/Squat Functional Strength Protocol']));
          await insertFieldIfExists(eventId, catName, 'Duration', faker.number.int({ min: 15, max: 150 }));
        } 
        else if (catName === 'Allergies') {
          await insertFieldIfExists(eventId, catName, 'Severity', severityValue);
          await insertFieldIfExists(eventId, catName, 'Possible Trigger', faker.helpers.arrayElement(['Tree Pollen Spores Bloom', 'Animal Dander Inhalation', 'Subsurface Dust Particles']));
        }
      }

      if (i === 0 || i === 1) {
        console.log(`> Seed Login Active -> User: ${email} | Pass: password123 | Role: ${role}`);
      }
    }

    console.log('Cleaning up empty patient profiles for doctors and admins...');
    await client.query(`
      DELETE FROM public.patient_profiles 
      WHERE id IN (
        SELECT p.id FROM public.patient_profiles p
        JOIN public.users u ON p.user_id = u.id
        WHERE u.role IN ('doctor', 'admin')
      );
    `);

    await client.query('COMMIT');
    console.log('--- Deep Seeding Complete Successfully! ---');
  } catch (err) {
    console.error('Seeding critical fault, rolling back...', err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();