-- Migration to change delivery status from enum to varchar
-- This allows us to use string values instead of enum for delivery status

-- First, update any existing records to use the enum values that will become strings
UPDATE deliveries SET status = 'PACKING' WHERE status = 'PACKING'::delivery_status;
UPDATE deliveries SET status = 'SHIPPING' WHERE status = 'SHIPPING'::delivery_status;
UPDATE deliveries SET status = 'DELIVERED' WHERE status = 'DELIVERED'::delivery_status;
UPDATE deliveries SET status = 'CANCELLED' WHERE status = 'CANCELLED'::delivery_status;

-- Drop the constraint that enforces the enum type
ALTER TABLE deliveries ALTER COLUMN status TYPE VARCHAR(50) USING status::VARCHAR;

-- Drop the enum type since it's no longer needed
DROP TYPE IF EXISTS delivery_status;

-- Add a check constraint to ensure only valid status values
ALTER TABLE deliveries ADD CONSTRAINT delivery_status_check 
    CHECK (status IN ('PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'));