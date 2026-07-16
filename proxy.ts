import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  
  // Sanitizar URL
  if (url.endsWith("/rest/v1/")) {
    url = url.slice(0, -9);
  } else if (url.endsWith("/rest/v1")) {
    url = url.slice(0, -8);
  }
  
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  const supabase = createServerClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteger la ruta /dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirigir de /login a /dashboard si ya está autenticado
  if (request.nextUrl.pathname.startsWith("/login")) {
    if (user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Intercepta las solicitudes únicamente para:
     * - Las rutas del dashboard (/dashboard y subrutas)
     * - La página de login (/login)
     */
    "/dashboard/:path*",
    "/login",
  ],
};
