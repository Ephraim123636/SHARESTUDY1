ALTER TABLE materials
ADD COLUMN material_type VARCHAR(30) NOT NULL DEFAULT 'unspecified' AFTER academic_year;

CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan ENUM('monthly', 'semester') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending_payment', 'active', 'cancelled') NOT NULL DEFAULT 'pending_payment',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscriptions_user_fk
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);
