import { createClient } from '@supabase/supabase-js';

// No Frontend (Vercel), o Vite exige import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 Supabase Initialization Debug:");
console.log("VITE_SUPABASE_URL:", supabaseUrl ? `✓ ${supabaseUrl.substring(0, 30)}...` : "✗ MISSING");
console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? `✓ ${supabaseAnonKey.substring(0, 20)}...` : "✗ MISSING");

// Se as variáveis sumirem, o site não crasha, ele avisa no console
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis do Supabase não carregadas.");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓ Carregado" : "✗ Faltando");
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓ Carregado" : "✗ Faltando");
}

let supabase;
try {
  supabase = createClient(
    supabaseUrl || '', 
    supabaseAnonKey || ''
  );
  console.log("✅ Supabase cliente criado com sucesso");
} catch (error) {
  console.error("❌ Erro ao criar cliente Supabase:", error);
}

export { supabase };