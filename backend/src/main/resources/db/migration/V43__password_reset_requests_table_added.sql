CREATE TABLE password_reset_requests (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) NOT NULL,
     ip_address TEXT NOT NULL,
     code CHAR(6) NOT NULL,
     is_used BOOLEAN DEFAULT FALSE,
     expires_at TIMESTAMP NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

     FOREIGN KEY (email) REFERENCES users(email)
);