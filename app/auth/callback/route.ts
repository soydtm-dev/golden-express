import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Route Handler GET para el callback de autenticación (PKCE flow).
 * Intercepta el código de autorización ('code') enviado por Supabase,
 * lo canjea por una sesión activa y redirige al usuario a la ruta indicada en 'next'.
 */
import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  
  // Si no se especifica 'next', redirigimos según el tipo (invite/recovery a /update-password, otros a /dashboard)
  const defaultNext = (type === "invite" || type === "recovery") ? "/update-password" : "/dashboard";
  const next = searchParams.get("next") ?? defaultNext;

  const supabase = await createClient();
  let authSuccess = false;

  if (code) {
    // Intercambiar el código PKCE por una sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      authSuccess = true;
    } else {
      console.error("Error al intercambiar el código por sesión:", error);
    }
  } else if (token_hash && type) {
    // Verificar token_hash enviado en enlaces de correo de Supabase
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      authSuccess = true;
    } else {
      console.error("Error al verificar token_hash con OTP:", error);
    }
  } else {
    // Verificar si ya existe una sesión activa mediante cookies
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      authSuccess = true;
    }
  }

  if (authSuccess) {
    // Verificar si el usuario debe actualizar su contraseña primero
    if (next === "/update-password") {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Obtener la información del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Consultar los datos del perfil en la tabla 'couriers'
      const { data: courier } = await supabase
        .from("couriers")
        .select("name, vehicle_info")
        .eq("id", user.id)
        .maybeSingle();

      // Si el perfil no existe o le faltan campos obligatorios (nombre o vehículo),
      // redirigir al formulario de registro para completar los datos faltantes.
      if (!courier || !courier.name || !courier.vehicle_info) {
        return NextResponse.redirect(`${origin}/register`);
      }
    }

    // Redirección exitosa a la URL indicada (por defecto /dashboard)
    return NextResponse.redirect(`${origin}${next}`);
  }

  console.warn("Callback de autenticación fallido. SearchParams recibidos:", Object.fromEntries(searchParams.entries()));

  // Si no se pudo validar la sesión o código, redirigimos al login con un mensaje descriptivo
  return NextResponse.redirect(`${origin}/login?error=No se pudo validar el enlace de autenticación`);
}
