CREATE TABLE IF NOT EXISTS password_resets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email_hash CHAR(64) NOT NULL,
    requester_hash CHAR(64) NOT NULL,
    token_hash CHAR(64) NULL UNIQUE,
    expires_at DATETIME NULL,
    requested_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    INDEX idx_password_resets_email_request (email_hash, requested_at),
    INDEX idx_password_resets_requester (requester_hash, requested_at),
    INDEX idx_password_resets_user (user_id),
    CONSTRAINT fk_password_resets_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
