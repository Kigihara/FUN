// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vndlykutumwmgojgtnxj.supabase.co'; // Замени на свой URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZGx5a3V0dW13bWdvamd0bnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA1NjM0MCwiZXhwIjoyMDY0NjMyMzQwfQ.H4B5Uqb6L47_yVm7JjD_oXZNxj3SbAXwZmliRnLY6xA'; // Замени на свой anon ключ

export const supabase = createClient(supabaseUrl, supabaseAnonKey);