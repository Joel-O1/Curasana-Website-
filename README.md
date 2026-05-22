# Curasana
A health tracking app for patients and doctors to log and monitor health events, medications, and appointments.

## Prerequisites
- [PostgreSQL](https://www.postgresql.org/download/) (v14 or higher)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourname/curasana.git
cd curasana
```

### 2. Set up the database
Create a PostgreSQL database and user:
```bash
psql -U postgres
```
```sql
CREATE USER admin WITH PASSWORD 'yourpassword';
CREATE DATABASE curasanadb OWNER admin;
GRANT ALL PRIVILEGES ON DATABASE curasanadb TO adminZ;
\q
```

### 3. Run the schema
```bash
psql -U admin -d curasanadb -f db/schema.sql
```

### 4. Seed the database
```bash
psql -U admin -d curasanadb -f db/seed.sql
```

### 5. Set up environment variables
Create a `.env` file in the project root:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=curasanadb
DB_USER=admin
DB_PASSWORD=yourpassword
```

## Database Structure
The database consists of 12 tables:

- `users` — all user accounts (patients, doctors, admins)
- `patient_profiles` — extended info for patients
- `doctor_profiles` — extended info for doctors
- `category` — health event categories (e.g. blood pressure, sleep, mood)
- `category_field_templates` — default fields for each system category
- `patient_categories` — categories assigned to a patient
- `health_event` — individual health events logged by a patient
- `health_event_fields` — field name/value pairs for each health event
- `medication` — medications prescribed or tracked by a patient
- `medication_log` — daily log of medication taken/missed
- `appointment` — medical appointments
- `aggregated_trend` — aggregated health trend data

## Project Structure
```
curasana/
├── db/
│   ├── schema.sql      # database schema, run first
│   └── seed.sql        # seed data, run second
├── .env                # environment variables (do not commit)
├── .gitignore
└── README.md
```

## Contributing
1. Create a new branch for your feature
```bash
git checkout -b feature/your-feature-name
```
2. Commit your changes
```bash
git add .
git commit -m "description of your change"
```
3. Push and open a pull request
```bash
git push origin feature/your-feature-name
```

## Installing required technologies
1. Download Node.js https://nodejs.org/en
2. Open terminal run "npm install" to install all dependencies
3. To start app run "npm run dev" and open localhost link