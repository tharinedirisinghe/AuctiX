-- Add address_requested column to deliveries table
ALTER TABLE deliveries
ADD COLUMN address_requested BOOLEAN NOT NULL DEFAULT FALSE;