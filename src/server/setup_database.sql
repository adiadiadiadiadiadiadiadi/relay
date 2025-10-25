-- Add password column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Update existing users to have a default password (in production, you'd want to handle this differently)
-- UPDATE users SET password = '$2b$10$defaultpassword' WHERE password IS NULL OR password = '';
