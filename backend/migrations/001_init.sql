CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    kind VARCHAR(80) NOT NULL,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    encrypted_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vault_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_type VARCHAR(50) NOT NULL DEFAULT 'read',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(vault_item_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_shares_vault_item_id ON vault_shares(vault_item_id);
