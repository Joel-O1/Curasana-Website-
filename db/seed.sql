TRUNCATE users, category, health_event RESTART IDENTITY CASCADE;

INSERT INTO category (category_name, category_type, definition, icon, color, description) VALUES
('Headache',                   'health', 'system', 'thermometer',   '#FF6B6B', 'Track headache severity, location and triggers'),
('Cough',                      'health', 'system', 'wind',          '#74B9FF', 'Track cough type, severity and duration'),
('Fever',                      'health', 'system', 'thermometer',   '#E17055', 'Track fever temperature and duration'),
('Sore Throat',                'health', 'system', 'activity',      '#FF9F43', 'Track sore throat severity and symptoms'),
('Fatigue',                    'health', 'system', 'battery',       '#A29BFE', 'Track fatigue levels and duration'),
('Dizziness',                  'health', 'system', 'refresh-cw',    '#00CEC9', 'Track dizziness episodes and triggers'),
('Nausea',                     'health', 'system', 'alert-circle',  '#FF6B81', 'Track nausea severity and triggers'),
('Vomiting',                   'health', 'system', 'alert-circle',  '#FD79A8', 'Track vomiting episodes and severity'),
('Diarrhea',                   'health', 'system', 'activity',      '#55EFC4', 'Track digestive symptoms and severity'),
('Constipation',               'health', 'system', 'activity',      '#FDCB6E', 'Track constipation and digestive issues'),
('Shortness of Breath',        'health', 'system', 'wind',          '#54A0FF', 'Track breathing difficulty and severity'),
('Chest Discomfort',           'health', 'system', 'heart',         '#FF6B6B', 'Track chest discomfort type and severity'),
('Stomach Pain',               'health', 'system', 'activity',      '#FAB1A0', 'Track stomach pain location and severity'),
('Back Pain',                  'health', 'system', 'activity',      '#FF9F43', 'Track back pain location and severity'),
('Joint Pain',                 'health', 'system', 'activity',      '#E17055', 'Track joint pain location and severity'),
('Rash',                       'health', 'system', 'shield',        '#81ECEC', 'Track rash location, appearance and spread'),
('Itching',                    'health', 'system', 'shield',        '#FAB1A0', 'Track itching location and severity'),
('Anxiety',                    'health', 'system', 'zap',           '#FDCB6E', 'Track anxiety levels and triggers'),
('Bad Dreams',                 'health', 'system', 'moon',          '#6C5CE7', 'Track bad dreams and sleep disturbances'),
('Poor Sleep',                 'health', 'system', 'moon',          '#A29BFE', 'Track poor sleep patterns and causes'),
('Panic Episode',              'health', 'system', 'zap',           '#FF6B81', 'Track panic episodes and triggers'),
('Loss of Appetite',           'health', 'system', 'coffee',        '#00CEC9', 'Track appetite loss and related symptoms'),
('Medication',                 'health', 'system', 'pill',          '#54A0FF', 'Track medication and side effects'),
('Side Effects',               'health', 'system', 'alert-circle',  '#FF6B81', 'Track side effects from medications or treatments'),
('Appointments',               'health', 'system', 'calendar',      '#A29BFE', 'Track medical appointments and follow ups'),
('Lab Tests',                  'health', 'system', 'flask',         '#00B894', 'Track lab test results and bloodwork'),
('Sleep',                      'health', 'system', 'moon',          '#6C5CE7', 'Track sleep duration and quality'),
('Mood and Mental Health',     'health', 'system', 'smile',         '#FD79A8', 'Track mood, anxiety, and mental wellbeing'),
('Diet',                       'health', 'system', 'coffee',        '#00CEC9', 'Track meals, nutrition, and eating habits'),
('Physical Activity',          'health', 'system', 'heart',         '#55EFC4', 'Track exercise and physical activity'),
('Stress',                     'health', 'system', 'zap',           '#FDCB6E', 'Track stress levels and triggers'),
('Environmental Exposure',     'health', 'system', 'wind',          '#74B9FF', 'Track exposure to allergens, pollution, or other environmental factors'),
('Allergies',                  'health', 'system', 'shield',        '#FAB1A0', 'Track allergic reactions and triggers'),
('Infection-Related Symptoms', 'health', 'system', 'thermometer',   '#E17055', 'Track symptoms related to infections or illness'),
('Recovery Notes',             'health', 'system', 'clipboard',     '#81ECEC', 'Track recovery progress after illness or surgery'),
('Caregiver Notes',            'health', 'system', 'users',         '#B2BEC3', 'Track notes and observations from caregivers');

-- ============================================================================
-- 10.2 SYMPTOM-SPECIFIC CATEGORIES (Headache, Cough, Fever, Sore Throat, etc.)
-- ============================================================================

-- HEADACHE
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Headache'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Headache'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Headache'), 'Duration', 'number', 'mins', false, 3),
((SELECT id FROM category WHERE category_name = 'Headache'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Headache'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Headache'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Headache'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Headache'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Headache'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- COUGH
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Cough'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Cough'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Cough'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Cough'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Cough'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Cough'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Cough'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Cough'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Cough'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- FEVER
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Fever'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Fever'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Fever'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Fever'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Fever'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Fever'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Fever'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Fever'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Fever'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- SORE THROAT
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Sore Throat'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- FATIGUE
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Fatigue'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- DIZZINESS
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Dizziness'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- NAUSEA
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Nausea'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Nausea'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Nausea'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Nausea'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Nausea'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Nausea'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Nausea'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Nausea'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Nausea'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- VOMITING
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Vomiting'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- DIARRHEA
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Diarrhea'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- CONSTIPATION
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Constipation'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Constipation'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Constipation'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Constipation'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Constipation'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Constipation'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Constipation'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Constipation'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Constipation'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- SHORTNESS OF BREATH
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Shortness of Breath'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- RASH
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Rash'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Rash'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Rash'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Rash'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Rash'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Rash'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Rash'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Rash'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Rash'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- ITCHING
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Itching'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Itching'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Itching'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Itching'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Itching'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Itching'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Itching'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Itching'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Itching'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- ANXIETY
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Anxiety'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- BAD DREAMS
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Bad Dreams'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- POOR SLEEP
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Poor Sleep'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- PANIC EPISODE
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Panic Episode'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- LOSS OF APPETITE
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Loss of Appetite'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- ALLERGIES
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Allergies'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Allergies'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Allergies'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Allergies'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Allergies'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Allergies'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Allergies'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Allergies'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Allergies'), 'Medical Care Sought', 'boolean', NULL, true, 9);

-- INFECTION-RELATED SYMPTOMS
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'Symptom Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'Severity', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'Duration', 'text', NULL, false, 3),
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'Body Location', 'text', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'Possible Trigger', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'Associated Symptoms', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'What Helped', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'What Made It Worse', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Infection-Related Symptoms'), 'Medical Care Sought', 'boolean', NULL, true, 9);


-- ============================================================================
-- 10.3 PAIN-SPECIFIC CATEGORIES (Chest Discomfort, Stomach, Back, Joint Pain)
-- ============================================================================

-- CHEST DISCOMFORT
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Chest Discomfort'), 'Pain Location', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Chest Discomfort'), 'Pain Type', 'select', NULL, true, 2), -- sharp, dull, burning, throbbing, pressure
((SELECT id FROM category WHERE category_name = 'Chest Discomfort'), 'Pain Severity', 'scale_1_10', NULL, true, 3),
((SELECT id FROM category WHERE category_name = 'Chest Discomfort'), 'Start Time', 'time', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Chest Discomfort'), 'End Time', 'time', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Chest Discomfort'), 'Trigger', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Chest Discomfort'), 'Medication or Action Taken', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Chest Discomfort'), 'Impact on Activity', 'text', NULL, false, 8);

-- STOMACH PAIN
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Stomach Pain'), 'Pain Location', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Stomach Pain'), 'Pain Type', 'select', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Stomach Pain'), 'Pain Severity', 'scale_1_10', NULL, true, 3),
((SELECT id FROM category WHERE category_name = 'Stomach Pain'), 'Start Time', 'time', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Stomach Pain'), 'End Time', 'time', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Stomach Pain'), 'Trigger', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Stomach Pain'), 'Medication or Action Taken', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Stomach Pain'), 'Impact on Activity', 'text', NULL, false, 8);

-- BACK PAIN
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Back Pain'), 'Pain Location', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Back Pain'), 'Pain Type', 'select', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Back Pain'), 'Pain Severity', 'scale_1_10', NULL, true, 3),
((SELECT id FROM category WHERE category_name = 'Back Pain'), 'Start Time', 'time', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Back Pain'), 'End Time', 'time', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Back Pain'), 'Trigger', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Back Pain'), 'Medication or Action Taken', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Back Pain'), 'Impact on Activity', 'text', NULL, false, 8);

-- JOINT PAIN
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Joint Pain'), 'Pain Location', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Joint Pain'), 'Pain Type', 'select', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Joint Pain'), 'Pain Severity', 'scale_1_10', NULL, true, 3),
((SELECT id FROM category WHERE category_name = 'Joint Pain'), 'Start Time', 'time', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Joint Pain'), 'End Time', 'time', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Joint Pain'), 'Trigger', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Joint Pain'), 'Medication or Action Taken', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Joint Pain'), 'Impact on Activity', 'text', NULL, false, 8);


-- ============================================================================
-- 10.4 MEDICATION-SPECIFIC CATEGORIES (Medication, Side Effects)
-- ============================================================================

-- MEDICATION
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Medication'), 'Medication Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Medication'), 'Dose', 'number', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Medication'), 'Unit', 'text', NULL, true, 3), -- mg, mcg, ml, tablets
((SELECT id FROM category WHERE category_name = 'Medication'), 'Time Scheduled', 'time', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Medication'), 'Time Taken', 'time', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Medication'), 'Adherence Status', 'select', NULL, true, 6), -- taken, missed, delayed, skipped
((SELECT id FROM category WHERE category_name = 'Medication'), 'Reason Missed', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Medication'), 'Side Effects', 'text', NULL, false, 8),
((SELECT id FROM category WHERE category_name = 'Medication'), 'Refill Status', 'text', NULL, false, 9),
((SELECT id FROM category WHERE category_name = 'Medication'), 'Prescriber or Pharmacy Note', 'text', NULL, false, 10);

-- SIDE EFFECTS (Kept custom since it shares metadata styles with medication side-effects tracking)
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Side Effects'), 'Medication Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Side Effects'), 'Side Effects Experienced', 'text', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Side Effects'), 'Severity Level', 'scale_1_10', NULL, true, 3),
((SELECT id FROM category WHERE category_name = 'Side Effects'), 'Prescriber Contacted', 'boolean', NULL, true, 4);


-- ============================================================================
-- 10.5 APPOINTMENT-SPECIFIC CATEGORIES (Appointments)
-- ============================================================================

-- APPOINTMENTS
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Appointments'), 'Appointment Type', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Appointments'), 'Provider Type', 'text', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Appointments'), 'Date and Time', 'datetime', NULL, true, 3),
((SELECT id FROM category WHERE category_name = 'Appointments'), 'Reason for Appointment', 'text', NULL, true, 4),
((SELECT id FROM category WHERE category_name = 'Appointments'), 'Questions to Ask', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Appointments'), 'Follow-up Instructions', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Appointments'), 'Related Lab or Test', 'text', NULL, false, 7),
((SELECT id FROM category WHERE category_name = 'Appointments'), 'Notes After Visit', 'text', NULL, false, 8);


-- ============================================================================
-- 10.6 LAB/TEST-SPECIFIC CATEGORIES (Lab Tests)
-- ============================================================================

-- LAB TESTS
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Lab Tests'), 'Test Name', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Lab Tests'), 'Test Date', 'date', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Lab Tests'), 'Result Status', 'select', NULL, true, 3), -- scheduled, completed, reviewed
((SELECT id FROM category WHERE category_name = 'Lab Tests'), 'Numeric Result', 'number', NULL, false, 4),
((SELECT id FROM category WHERE category_name = 'Lab Tests'), 'Unit', 'text', NULL, false, 5),
((SELECT id FROM category WHERE category_name = 'Lab Tests'), 'Reference Range', 'text', NULL, false, 6),
((SELECT id FROM category WHERE category_name = 'Lab Tests'), 'Follow-up Needed', 'boolean', NULL, true, 7);


-- ============================================================================
-- REMAINING MISCELLANEOUS LIFESTYLE & METRIC CATEGORIES
-- ============================================================================

-- SLEEP
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Sleep'), 'Duration', 'number', 'hrs', true, 1),
((SELECT id FROM category WHERE category_name = 'Sleep'), 'Quality Score', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Sleep'), 'Disruptions', 'text', NULL, false, 3);

-- MOOD AND MENTAL HEALTH
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Mood and Mental Health'), 'Mood Rating', 'scale_1_10', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Mood and Mental Health'), 'Anxiety Level', 'scale_1_10', NULL, false, 2),
((SELECT id FROM category WHERE category_name = 'Mood and Mental Health'), 'Triggers or Context', 'text', NULL, false, 3);

-- DIET
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Diet'), 'Meal Log', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Diet'), 'Water Intake', 'number', 'ml', false, 2),
((SELECT id FROM category WHERE category_name = 'Diet'), 'Symptoms Post-Meal', 'text', NULL, false, 3);

-- PHYSICAL ACTIVITY
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Physical Activity'), 'Activity Description', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Physical Activity'), 'Duration', 'number', 'mins', true, 2),
((SELECT id FROM category WHERE category_name = 'Physical Activity'), 'Impact on Symptoms', 'text', NULL, false, 3);

-- STRESS
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Stress'), 'Stress Level', 'scale_1_10', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Stress'), 'Primary Stressor', 'text', NULL, false, 2),
((SELECT id FROM category WHERE category_name = 'Stress'), 'Coping Strategies Tried', 'text', NULL, false, 3);

-- ENVIRONMENTAL EXPOSURE
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Environmental Exposure'), 'Allergen/Toxin Type', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Environmental Exposure'), 'Severity of Exposure', 'scale_1_10', NULL, true, 2),
((SELECT id FROM category WHERE category_name = 'Environmental Exposure'), 'Symptoms Provoked', 'text', NULL, false, 3);

-- RECOVERY NOTES
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Recovery Notes'), 'Overall Progress Rating', 'scale_1_10', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Recovery Notes'), 'Milestones Achieved', 'text', NULL, false, 2),
((SELECT id FROM category WHERE category_name = 'Recovery Notes'), 'Setbacks or Obstacles', 'text', NULL, false, 3);

-- CAREGIVER NOTES
INSERT INTO category_field_templates (category_id, field_name, field_type, unit, is_required, display_order) VALUES 
((SELECT id FROM category WHERE category_name = 'Caregiver Notes'), 'Caregiver Observations', 'text', NULL, true, 1),
((SELECT id FROM category WHERE category_name = 'Caregiver Notes'), 'Tasks Assisted With', 'text', NULL, false, 2),
((SELECT id FROM category WHERE category_name = 'Caregiver Notes'), 'Interventions Administered', 'text', NULL, false, 3);




