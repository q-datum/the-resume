CREATE TABLE IF NOT EXISTS chat_session (
                                            id VARCHAR(36) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS chat_message (
                                            id SERIAL PRIMARY KEY,
                                            role VARCHAR(50) NOT NULL,
                                            content TEXT NOT NULL,
                                            session_id VARCHAR(36) NOT NULL REFERENCES chat_session(id) ON DELETE CASCADE
);
