-- Migration: Add image support to cases table
-- Este script adiciona suporte a imagens nos casos
-- 
-- INSTRUÇÕES:
-- 1. Copie o SQL abaixo e execute no Supabase SQL Editor
-- 2. Crie um bucket chamado "case-images" no Supabase Storage
-- 3. Configure as políticas de acesso conforme descrito abaixo

-- ===== STEP 1: Adicionar coluna images na tabela cases =====
-- A coluna armazena um array JSON com os dados em base64 das imagens
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Exemplo de dados armazenados:
-- images = [
--   {
--     "name": "imagem1.jpg",
--     "size": 102400,
--     "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
--     "uploadedAt": "2024-01-30T12:00:00Z"
--   }
-- ]

-- ===== STEP 2: Criar políticas de acesso ao Storage =====
-- NO SUPABASE DASHBOARD:
-- 1. Vá em Storage > Buckets
-- 2. Crie um novo bucket chamado "case-images"
-- 3. Configure as seguintes políticas:

-- SELECT: Para qualquer um (public read)
-- CREATE POLICY "Public read" ON storage.objects 
-- FOR SELECT USING (bucket_id = 'case-images');

-- INSERT: Para usuários autenticados (authenticated write)
-- CREATE POLICY "Authenticated upload" ON storage.objects 
-- FOR INSERT WITH CHECK (bucket_id = 'case-images' AND auth.role() = 'authenticated');

-- DELETE: Para o proprietário deletar suas próprias imagens
-- CREATE POLICY "Authenticated delete own" ON storage.objects 
-- FOR DELETE USING (bucket_id = 'case-images' AND auth.uid() = owner);

-- ===== STEP 3: Verificar se a coluna foi criada =====
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'cases' AND column_name = 'images';
