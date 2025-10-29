-- Add firebase_uid column to users table
ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(255) UNIQUE;

-- Make the password column nullable since Firebase will handle auth
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

