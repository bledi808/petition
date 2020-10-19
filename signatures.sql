DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
     id SERIAL PRIMARY KEY,
     signature TEXT NOT NULL,
     user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- removed first and last columns
-- added foreign key (user_id); identifies which users from the users table signed the petition and which ssignature is theirs