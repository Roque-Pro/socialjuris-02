import { createClient } from '@supabase/supabase-js';

// No Frontend (Vercel), o Vite exige import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se as variáveis sumirem, o site não crasha, ele avisa no console
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Atenção: Variáveis do Supabase não carregadas no Frontend.");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);