import { createClient } from '@supabase/supabase-js';

// No Frontend (Vercel), o Vite exige import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log("🔍 Supabase Initialization Debug:");
console.log("VITE_SUPABASE_URL:", supabaseUrl ? `✓ ${supabaseUrl.substring(0, 30)}...` : "✗ MISSING");
console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? `✓ ${supabaseAnonKey.substring(0, 20)}...` : "✗ MISSING");

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis do Supabase não carregadas.");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓ Carregado" : "✗ FALTANDO");
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓ Carregado" : "✗ FALTANDO");
  console.error("Verifique as variáveis de ambiente em Vercel/Render");
  
  // Mock client para evitar crash
  supabase = {
    from: () => { throw new Error("Supabase não inicializado"); },
    auth: { 
      getSession: () => Promise.reject(new Error("Supabase não inicializado")),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✅ Supabase cliente criado com sucesso");
}

export { supabase };
