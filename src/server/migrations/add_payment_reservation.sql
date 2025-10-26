-- Add payment_reservation column to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS payment_reservation TEXT NULL COMMENT 'Stores payment XDR when job is claimed';

-- Update existing jobs to have NULL payment_reservation
UPDATE jobs SET payment_reservation = NULL WHERE payment_reservation IS NOT NULL;

