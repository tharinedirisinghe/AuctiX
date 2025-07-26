CREATE TABLE suspended_users (
     id UUID NOT NULL DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL,
     suspended_by UUID NOT NULL,
     reason TEXT,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     suspended_until TIMESTAMP,
     PRIMARY KEY (id),
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     FOREIGN KEY (suspended_by) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users
    ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT FALSE;