import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea y retorna un cliente de Supabase para su uso exclusivo en Client Components.
 * Utiliza variables de entorno públicas para establecer la conexión.
 */
export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  
  // Limpieza robusta de la URL de Supabase para evitar errores de ruta duplicada (PGRST125)
  if (url.endsWith("/rest/v1/")) {
    url = url.slice(0, -9);
  } else if (url.endsWith("/rest/v1")) {
    url = url.slice(0, -8);
  }
  
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  return createBrowserClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
