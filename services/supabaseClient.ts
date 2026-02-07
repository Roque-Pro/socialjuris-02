import { createClient } from '@supabase/supabase-js';

// No Frontend (Vercel), o Vite exige import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se as variáveis sumirem, o site não crasha, ele avisa no console
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis do Supabase não carregadas.");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓ Carregado" : "✗ Faltando");
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓ Carregado" : "✗ Faltando");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);