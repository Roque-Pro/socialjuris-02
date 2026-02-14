-- Criar tabela de banners para o painel admin
CREATE TABLE IF NOT EXISTS admin_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- 'banner_1' ou 'banner_2'
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de segurança (RLS)
ALTER TABLE admin_banners ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler banners (públicos)
CREATE POLICY "admin_banners_select_all"
  ON admin_banners FOR SELECT
  USING (TRUE);

-- Policy: Apenas admin pode atualizar banners
CREATE POLICY "admin_banners_update_admin"
  ON admin_banners FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Policy: Apenas admin pode inserir banners
CREATE POLICY "admin_banners_insert_admin"
  ON admin_banners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Criar bucket de storage para banners
INSERT INTO storage.buckets (id, name, public)
  VALUES ('banners', 'banners', true)
  ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para banners
CREATE POLICY "banners_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "banners_admin_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "banners_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banners' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Inserir banners padrão (opcional)
INSERT INTO admin_banners (name, image_url, link_url)
  VALUES 
    ('banner_1', 'https://via.placeholder.com/280x584?text=Banner+1', '#'),
    ('banner_2', 'https://via.placeholder.com/280x584?text=Banner+2', '#')
  ON CONFLICT (name) DO NOTHING;
