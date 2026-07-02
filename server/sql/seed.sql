INSERT INTO users (id, name, email)
VALUES (1, 'Aarav Sharma', 'aarav@calendlyclone.dev')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

INSERT INTO availability_settings (user_id, timezone)
VALUES (1, 'Asia/Kolkata')
ON CONFLICT (user_id) DO UPDATE SET timezone = EXCLUDED.timezone;

INSERT INTO availability_rules (user_id, day_of_week, is_enabled, start_time, end_time)
VALUES
  (1, 0, FALSE, '09:00:00', '17:00:00'),
  (1, 1, TRUE, '09:00:00', '17:00:00'),
  (1, 2, TRUE, '09:00:00', '17:00:00'),
  (1, 3, TRUE, '09:00:00', '17:00:00'),
  (1, 4, TRUE, '09:00:00', '17:00:00'),
  (1, 5, TRUE, '09:00:00', '16:00:00'),
  (1, 6, FALSE, '09:00:00', '12:00:00')
ON CONFLICT (user_id, day_of_week) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time;

INSERT INTO event_types (id, user_id, name, slug, duration_minutes, description, location, color_hex, is_active)
VALUES
  (1, 1, 'Intro call', 'intro-call', 30, 'A quick introduction to align on your goals and next steps.', 'Google Meet', '#006bff', TRUE),
  (2, 1, 'Product demo', 'product-demo', 45, 'Walk through your use case and see the product in action.', 'Zoom', '#0f766e', TRUE),
  (3, 1, 'Design review', 'design-review', 60, 'Collaborative review for flows, UI, and implementation details.', 'Google Meet', '#7c3aed', TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  duration_minutes = EXCLUDED.duration_minutes,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  color_hex = EXCLUDED.color_hex,
  is_active = EXCLUDED.is_active;

INSERT INTO meetings (event_type_id, host_user_id, invitee_name, invitee_email, start_at, end_at, status)
SELECT 1, 1, 'Neha Gupta', 'neha@example.com', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 30 minutes', 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM meetings WHERE invitee_email = 'neha@example.com'
);

INSERT INTO meetings (event_type_id, host_user_id, invitee_name, invitee_email, start_at, end_at, status)
SELECT 2, 1, 'Rahul Verma', 'rahul@example.com', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' - INTERVAL '45 minutes', 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM meetings WHERE invitee_email = 'rahul@example.com'
);
