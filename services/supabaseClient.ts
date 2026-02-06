import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONEXÃO COM O SUPABASE
// Configurada com as credenciais do projeto 'bgvktrdedcwnjywpkanc'
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://bgvktrdedcwnjywpkanc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndmt0cmRlZGN3bmp5d3BrYW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjcyOTgsImV4cCI6MjA4MDcwMzI5OH0.eK5JzbJSkf4eSPTuvaJtNsmDTuOx1QEaGPJRq08pOwc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);