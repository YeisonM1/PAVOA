import { createClient } from '@supabase/supabase-js';

// URL extraída de tu referencia de proyecto
const supabaseUrl = 'https://jkyindmesdnptuvmetfv.supabase.co'; 

// Esta es la clave que empieza por "eyJ..." y tiene el rol "anon" que me pasaste
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreWluZG1lc2RucHR1dm1ldGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTExNDYsImV4cCI6MjA5MDgyNzE0Nn0.5-WFCO2mxDeZFETpilDSLx40obsX_-_udKcO-bkByH0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);