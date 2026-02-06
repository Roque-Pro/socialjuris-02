-- MIGRATION: Credit Lock System (Modelo 1)
-- Implementa o sistema de travamento de créditos com expiração automática

-- ===== CREATE credit_locks TABLE =====
CREATE TABLE IF NOT EXISTS public.credit_locks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lawyer_id uuid NOT NULL,
  case_id uuid NOT NULL,
  locked_credits integer NOT NULL DEFAULT 1,
  status text DEFAULT 'ACTIVE'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone NOT NULL,
  consumed_at timestamp with time zone,
  CONSTRAINT credit_locks_pkey PRIMARY KEY (id),
  CONSTRAINT credit_locks_lawyer_id_fkey FOREIGN KEY (lawyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT credit_locks_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE,
  CONSTRAINT credit_locks_lawyer_case_unique UNIQUE (lawyer_id, case_id)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS credit_locks_lawyer_id_idx ON public.credit_locks(lawyer_id);
CREATE INDEX IF NOT EXISTS credit_locks_case_id_idx ON public.credit_locks(case_id);
CREATE INDEX IF NOT EXISTS credit_locks_expires_at_idx ON public.credit_locks(expires_at);
CREATE INDEX IF NOT EXISTS credit_locks_status_idx ON public.credit_locks(status);

-- RLS
ALTER TABLE public.credit_locks ENABLE ROW LEVEL SECURITY;

-- Política: Advogados podem criar credit locks para si mesmos
CREATE POLICY "Lawyers can insert own credit locks" ON public.credit_locks
  FOR INSERT WITH CHECK (auth.uid() = lawyer_id);

-- Política: Advogados podem ler seus próprios credit locks
CREATE POLICY "Lawyers can view own credit locks" ON public.credit_locks
  FOR SELECT USING (auth.uid() = lawyer_id);

-- Política: Advogados podem atualizar seus próprios credit locks
CREATE POLICY "Lawyers can update own credit locks" ON public.credit_locks
  FOR UPDATE USING (auth.uid() = lawyer_id);

-- Política: Clientes podem ler credit locks de seus casos
CREATE POLICY "Clients can view credit locks of their cases" ON public.credit_locks
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM public.cases WHERE client_id = auth.uid()
    )
  );

-- Política: Admins (service role) podem fazer tudo
CREATE POLICY "Service role can manage all" ON public.credit_locks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
