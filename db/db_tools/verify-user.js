// Usage: node db/verify-user.js someone@example.com
// Prints what the dashboard SHOULD show for that user, straight from the DB.
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envText = fs.readFileSync(path.join(__dirname, '..', '..', '.env'), 'utf8');
const dbUrl = envText.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
if (!dbUrl) { console.error('DATABASE_URL not found in .env'); process.exit(1); }

const email = process.argv[2];
if (!email) { console.error('Usage: node db/verify-user.js <email>'); process.exit(1); }

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

(async () => {
  const client = await pool.connect();
  try {
    const users = await client.query(
      `SELECT u.id AS user_id, u.email, u.role,
              pp.id AS patient_id, pp.first_name, pp.last_name
       FROM users u
       LEFT JOIN patient_profiles pp ON pp.user_id = u.id
       WHERE u.email ILIKE $1
       ORDER BY u.id`,
      [email]
    );

    if (users.rows.length === 0) {
      console.log(`No user found with email ${email}`);
      return;
    }
    if (users.rows.length > 1) {
      console.log(`WARNING: ${users.rows.length} users share this email (case variants):`);
    }
    console.table(users.rows);

    for (const u of users.rows) {
      console.log(`\n=== ${u.email} (user_id=${u.user_id}, patient_id=${u.patient_id ?? 'none'}) ===`);

      if (u.patient_id) {
        const events = await client.query(
          `SELECT c.category_name, COUNT(*) AS events,
                  MIN(he.date) AS first_date, MAX(he.date) AS last_date,
                  ROUND(AVG(he.severity), 1) AS avg_severity
           FROM health_event he
           JOIN category c ON c.id = he.category_id
           WHERE he.patient_id = $1
           GROUP BY c.category_name
           ORDER BY events DESC`,
          [u.patient_id]
        );
        console.log(`Health events: ${events.rows.reduce((s, r) => s + Number(r.events), 0)} total`);
        console.table(events.rows);
      }

      const meds = await client.query(
        `SELECT m.medication_name, p.dose, p.unit, p.status,
                COUNT(ml.id) AS log_entries,
                MIN(ml.scheduled_time)::date AS first_log,
                MAX(ml.scheduled_time)::date AS last_log
         FROM prescription p
         JOIN medication m ON m.id = p.medication_id
         LEFT JOIN medication_log ml ON ml.prescription_id = p.id
         WHERE p.patient_id = $1
         GROUP BY m.medication_name, p.dose, p.unit, p.status
         ORDER BY m.medication_name`,
        [u.user_id]
      );
      console.log(`Prescriptions: ${meds.rows.length}`);
      console.table(meds.rows);
    }
  } finally {
    client.release();
    await pool.end();
  }
})();
