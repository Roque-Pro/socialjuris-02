import { createClient } from '@supabase/supabase-js';

// No Frontend (Vercel), o Vite exige import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log("🔍 Supabase Initialization Debug:");
console.log("VITE_SUPABASE_URL:", supabaseUrl ? `✓ ${supabaseUrl.substring(0, 30)}...` : "✗ MISSING");
console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? `✓ ${supabaseAnonKey.substring(0, 20)}...` : "✗ MISSING");

let supabase: any;

// Se as variáveis sumirem, mostrar erro antes de crashear
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis do Supabase não carregadas.");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓ Carregado" : "✗ FALTANDO");
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓ Carregado" : "✗ FALTANDO");
  console.error("Verifique as variáveis de ambiente em Vercel/Render");
  
  // Criar um cliente mock que vai errar quando tentar usar
  supabase = {
    from: () => { throw new Error("Supabase não inicializado. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"); },
    auth: { 
      getSession: () => Promise.reject(new Error("Supabase não inicializado")),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    channel: () => ({ on: () => ({ subscribe: () => {} }), removeChannel: () => {} })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✅ Supabase cliente criado com sucesso");
}

export { supabase };
