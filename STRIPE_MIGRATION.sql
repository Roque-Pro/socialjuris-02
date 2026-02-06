-- Adicionar colunas Stripe à tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscription_id ON profiles(stripe_subscription_id);
