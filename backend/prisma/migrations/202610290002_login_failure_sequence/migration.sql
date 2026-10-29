-- Keep the original username/IP/timestamp evidence for 24-hour retention while
-- marking username failures preceding a success, even at equal clock instants.
ALTER TABLE login_failure ADD COLUMN username_sequence_active boolean NOT NULL DEFAULT true;
