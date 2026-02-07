import { createClient } from '@supabase/supabase-js';

// Tenta pegar das variáveis de ambiente primeiro, se não existir, usa a string fixa
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bgvktrdedcwnjywpkanc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndmt0cmRlZGN3bmp5d3BrYW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjcyOTgsImV4cCI6MjA4MDcwMzI5OH0.eK5JzbJSkf4eSPTuvaJtNsmDTuOx1QEaGPJRq08pOwc';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ ERRO: Supabase URL ou Key não encontradas!");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);