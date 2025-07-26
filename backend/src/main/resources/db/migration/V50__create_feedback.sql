CREATE TABLE feedback (
    id UUID PRIMARY KEY,
    user_id UUID,
    rating INT NOT NULL,
    comment VARCHAR(1000) NOT NULL,
    submitted_at TIMESTAMP NOT NULL
);