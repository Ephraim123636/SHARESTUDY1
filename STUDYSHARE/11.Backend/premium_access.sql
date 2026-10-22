ALTER TABLE materials
    ADD COLUMN is_premium TINYINT(1) NOT NULL DEFAULT 0 AFTER material_type;

ALTER TABLE subscriptions
    ADD COLUMN expires_at DATETIME NULL AFTER status;
