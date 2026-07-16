import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase admin environment variables (NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY).");
}

/**
 * ¡CRÍTICO: ADVERTENCIA DE SEGURIDAD!
 * Este cliente de Supabase se inicializa utilizando la clave de rol de servicio (Service Role Key).
 * Esto le otorga privilegios administrativos completos que omiten las reglas de RLS (Row Level Security).
 * 
 * NUNCA debe importarse ni ejecutarse en Client Components ("use client").
 * Su uso está estrictamente restringido a archivos del lado del servidor:
 * - Server Components
 * - Server Actions ("use server")
 * - API Routes (app/api/...)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
