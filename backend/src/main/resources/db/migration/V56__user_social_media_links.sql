CREATE TABLE user_social_media_links (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    link TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_usml_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users
    ADD COLUMN bio TEXT,
    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
