import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea y retorna un cliente de Supabase para su uso en Server Components,
 * Server Actions y Route Handlers. Maneja el almacenamiento de cookies de forma asíncrona.
 */
export async function createClient() {
  const cookieStore = await cookies();

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

  return createServerClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método setAll puede ser llamado desde un Server Component.
            // Esto se puede ignorar si tienes un middleware refrescando la sesión del usuario.
          }
        },
      },
    }
  );
}
