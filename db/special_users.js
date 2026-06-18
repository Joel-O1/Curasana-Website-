require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Map targeting your core lookup table IDs
const CATEGORY_MAP = { "Symptom": 1, "Sleep": 2, "Activity": 3 };

const specialUsersToSeed = [
    { email: "alpha.five@curisana.test", full_name: "Alpha Five", logsCount: 5, profile: "new_acute" },
    { email: "beta.fifteen@curisana.test", full_name: "Beta Fifteen", logsCount: 15, profile: "casual_intermittent" },
    { email: "gamma.fifty@curisana.test", full_name: "Gamma Fifty", logsCount: 50, profile: "power_chronic" }
];

/**
 * Helper utility to return keys using custom relative array weights
 */
function weightedRandom(options, weights) {
    let totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let randomNum = Math.random() * totalWeight;
    
    for (let i = 0; i < options.length; i++) {
        if (randomNum < weights[i]) {
            return options[i];
        }
        randomNum -= weights[i];
    }
    return options[0];
}

/**
 * Explicit matrix hydrator mapping timeline profiles to arrays of logs
 */
function generateSimulatedUserLogs(patientId, count, profile) {
    const logs = [];
    const symptomPool = ['Headache', 'Cough', 'Fever', 'Fatigue', 'Nausea'];

    for (let i = 0; i < count; i++) {
        // Build timeline date backward from current date
        const logDate = new Date();
        logDate.setDate(logDate.getDate() - i);
        const dateStr = logDate.toISOString().split('T')[0];
        const timeStr = `09:30:00`;

        let severityValue;
        let chosenSymptom = weightedRandom(symptomPool, [1, 1, 1, 1, 1]);

        if (profile === 'new_acute') {
            // New acute profiles spike extreme values immediately
            severityValue = weightedRandom([8, 9, 10], [0.5, 0.4, 0.1]);
        } else if (profile === 'casual_intermittent') {
            // Intermittent tracking trends lower baseline distributions
            severityValue = weightedRandom([2, 3, 4, 5], [0.3, 0.4, 0.2, 0.1]);
        } else {
            // Chronic power users vary extensively across mid-to-high indices
            severityValue = weightedRandom([5, 6, 7, 8], [0.2, 0.4, 0.3, 0.1]);
        }

        logs.push({
            patient_id: patientId,
            category_id: CATEGORY_MAP["Symptom"],
            severity: severityValue,
            date: dateStr,
            time: timeStr,
            fields: [{ field_name: 'Symptom Name', field_value: chosenSymptom }]
        });
    }
    return logs;
}

async function seedSpecialHealthData() {
    const client = await pool.connect();
    try {
        console.log('--- Start Special Clinical Profile Seeding ---');
        await client.query('BEGIN');

        // AUTOMATED CLEANUP: Erase existing matches in identity auth to guarantee clean reruns
        console.log('Clearing historical @curisana.test accounts from auth layer...');
        await client.query("DELETE FROM auth.users WHERE email LIKE '%@curisana.test';");

        const TEST_PASSWORD = "Password123!";

        for (const user of specialUsersToSeed) {
            console.log(`Creating Auth identity for ${user.email}...`);
            
            // Create the user in Supabase Auth schema using Admin privileges
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: user.email,
                password: TEST_PASSWORD,
                email_confirm: true 
            });

            if (authError) {
                if (authError.message.includes("already registered")) {
                    console.log(`User ${user.email} already exists in Auth. Fetching existing ID...`);
                    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
                    const existingUser = list.users.find(u => u.email === user.email);
                    user.id = existingUser.id;
                } else {
                    throw authError;
                }
            } else {
                user.id = authUser.user.id; 
            }

            // Sync structural primary key safely into public mapping table
            await client.query(
                `INSERT INTO public.users (id, email, role, onboarded) 
                 VALUES ($1, $2, $3, true) 
                 ON CONFLICT (id) DO UPDATE SET role = $3, onboarded = true`,
                [user.id, user.email, 'patient']
            );

            // Insert patient profile using the new UUID architecture 
            const profileRes = await client.query(
                `INSERT INTO public.patient_profiles (user_id, first_name, last_name, location) 
                 VALUES ($1, $2, 'Test User', 'Edmonton, AB') 
                 ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name 
                 RETURNING id`,
                [user.id, user.full_name]
            );
            const patientProfileId = profileRes.rows[0].id;

            // Generate customized algorithmic metrics arrays
            const generatedLogs = generateSimulatedUserLogs(patientProfileId, user.logsCount, user.profile);

            for (const log of generatedLogs) {
                const eventResult = await client.query(
                    `INSERT INTO public.health_event (patient_id, category_id, severity, date, time, event_title) 
                     VALUES ($1, $2, $3, $4, $5, 'Seeded Case Study Matrix') RETURNING id`,
                    [log.patient_id, log.category_id, log.severity, log.date, log.time]
                );
                const eventId = eventResult.rows[0].id;

                await client.query(
                    `INSERT INTO public.health_event_fields (event_id, field_name, field_value, is_custom) 
                     VALUES ($1, $2, $3, false)`,
                    [eventId, 'Symptom Name', log.fields[0].field_value]
                );
            }
            console.log(`✅ Seeded ${user.full_name} (Supabase ID: ${user.id} | Profile ID: ${patientProfileId})`);
        }
        
        await client.query('COMMIT');
        console.log('--- Special Seeding Completed Successfully! ---');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Seeding critical fault, rolling back...", err);
    } finally {
        client.release();
        await pool.end();
    }
}

seedSpecialHealthData();