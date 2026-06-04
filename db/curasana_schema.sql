DROP TABLE IF EXISTS aggregated_trend, medication_log, health_event_fields, health_event, appointment, medication, patient_categories, category_field_templates, patient_profiles, doctor_profiles, category, users CASCADE;
DROP TYPE IF EXISTS status;

CREATE TYPE status AS ENUM (
  'taken',
  'missed',
  'delayed',
  'skipped'
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username varchar not null unique,
  email varchar not null unique,
  password_hash varchar not null,
  role varchar not null, -- e.g., 'patient', 'doctor', 'admin'
  created_at timestamp default NOW()
);

CREATE TABLE category (
  id SERIAL PRIMARY KEY,
  category_name varchar not null unique,
  category_type varchar,
  definition varchar,
  icon varchar,
  color varchar,
  description varchar
);

CREATE TABLE doctor_profiles (
  id SERIAL PRIMARY KEY,
  user_id integer UNIQUE NOT NULL,
  specialty varchar,
  license_number varchar,
  created_at timestamp default NOW(),
  CONSTRAINT fk_doctor_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE patient_profiles (
  id SERIAL PRIMARY KEY,
  user_id integer UNIQUE NOT NULL,
  first_name varchar,
  last_name varchar,
  date_of_birth date,
  created_at timestamp default NOW(),
  CONSTRAINT fk_patient_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE category_field_templates (
  id SERIAL PRIMARY KEY,
  category_id integer NOT NULL,
  field_name varchar not null,
  field_type varchar not null, -- scale_1_10, text, number, boolean, select, time
  unit varchar,
  is_required boolean default false,
  display_order integer,
  CONSTRAINT fk_category_field_templates_category_id FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT,
  CONSTRAINT uq_category_field UNIQUE (category_id, field_name)
);

CREATE TABLE patient_categories (
  id SERIAL PRIMARY KEY,
  user_id integer NOT NULL,
  category_id integer NOT NULL,
  is_custom boolean default false,
  created_at timestamp default NOW(),
  CONSTRAINT fk_patient_categories_patient_id FOREIGN KEY (user_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_patient_categories_category_id FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
);

CREATE TABLE medication (
  id SERIAL PRIMARY KEY,
  patient_id integer NOT NULL, -- Fixed: Swapped user_id for patient_id
  medication_name varchar not null,
  dose numeric,               -- Fixed: Changed to numeric to allow decimal doses (e.g., 0.5mg or 7.5ml)
  unit varchar,
  frequency varchar,
  start_date date,
  end_date date,
  status varchar,
  notes varchar,
  created_at timestamp default NOW(),
  CONSTRAINT fk_medication_patient_id FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

CREATE TABLE appointment (
  id SERIAL PRIMARY KEY,
  patient_id integer NOT NULL, -- Fixed: Swapped user_id for patient_id
  appt_type varchar,
  provider_type varchar,
  date date not null,
  time time with time zone,
  reason varchar,
  notes varchar,
  follow_up_required boolean default false,
  created_at timestamp default NOW(),
  CONSTRAINT fk_appointment_patient_id FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

CREATE TABLE health_event (
  id SERIAL PRIMARY KEY,
  patient_id integer NOT NULL, -- Fixed: Direct connection to the patient profile
  category_id integer NOT NULL,
  event_title varchar,
  event_type varchar,
  date date not null default CURRENT_DATE,
  time time with time zone not null default CURRENT_TIME,
  severity integer,            -- Maps to your global severity level (10.1)
  notes varchar,
  tags varchar,
  related_medication_id integer,
  related_appt_id integer,
  created_at timestamp default NOW(),
  updated_at timestamp default NOW(),
  CONSTRAINT fk_health_event_patient_id FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_health_event_category_id FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT,
  CONSTRAINT fk_health_event_related_appt_id FOREIGN KEY (related_appt_id) REFERENCES appointment(id) ON DELETE SET NULL,
  CONSTRAINT fk_health_event_related_medication_id FOREIGN KEY (related_medication_id) REFERENCES medication(id) ON DELETE SET NULL
);

CREATE TABLE health_event_fields (
  id SERIAL PRIMARY KEY,
  event_id integer NOT NULL,
  template_field_id integer, -- Fixed: Link straight to metadata ID instead of parsing strings
  field_name varchar,
  field_value varchar NOT NULL,
  is_custom boolean DEFAULT FALSE,
  created_at timestamp default NOW(),
  CONSTRAINT fk_health_event_fields_event_id FOREIGN KEY (event_id) REFERENCES health_event(id) ON DELETE CASCADE,
  CONSTRAINT fk_health_event_fields_template FOREIGN KEY (template_field_id) REFERENCES category_field_templates(id) ON DELETE RESTRICT,
);

CREATE TABLE medication_log (
  id SERIAL PRIMARY KEY,
  medication_id integer NOT NULL,
  patient_id integer NOT NULL,      -- Fixed: Swapped user_id for patient_id
  health_event_id integer,   
  scheduled_time time,
  actual_time time,
  status status not null,
  reason_missed varchar,
  side_effects varchar,
  created_at timestamp default NOW(),
  CONSTRAINT fk_medication_log_medication_id FOREIGN KEY (medication_id) REFERENCES medication(id) on delete cascade,
  CONSTRAINT fk_medication_log_patient_id FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) on delete cascade,
  CONSTRAINT fk_medication_log_health_event_id FOREIGN KEY (health_event_id) REFERENCES health_event(id) on delete set null
);

CREATE TABLE aggregated_trend (
  area_id SERIAL PRIMARY KEY,
  start_date date,
  end_date date,
  symptom_category varchar,
  count integer,
  baseline_count integer,
  percentage_chance integer,
  trend_status varchar,
  created_at timestamp default NOW()
);