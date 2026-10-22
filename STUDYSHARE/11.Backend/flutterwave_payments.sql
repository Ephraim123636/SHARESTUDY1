ALTER TABLE subscriptions
    ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'ZMW' AFTER amount,
    ADD COLUMN tx_ref VARCHAR(80) NULL AFTER currency,
    ADD UNIQUE KEY subscriptions_tx_ref_unique (tx_ref),
    ADD COLUMN transaction_id VARCHAR(30) NULL AFTER tx_ref,
    ADD UNIQUE KEY subscriptions_transaction_id_unique (transaction_id),
    ADD COLUMN paid_at DATETIME NULL AFTER transaction_id;
