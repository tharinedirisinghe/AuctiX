ALTER TABLE password_reset_requests
    ADD COLUMN code_checks SMALLINT NOT NULL DEFAULT 0;