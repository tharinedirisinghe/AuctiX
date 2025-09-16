-- Fix user_addresses column lengths to match entity definitions
ALTER TABLE user_addresses ALTER COLUMN city TYPE VARCHAR(50);
ALTER TABLE user_addresses ALTER COLUMN state TYPE VARCHAR(50);