"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    
    // Limpieza de URL para evitar rutas duplicadas de la API REST de Supabase
    if (url.endsWith("/rest/v1/")) {
      url = url.slice(0, -9);
    } else if (url.endsWith("/rest/v1")) {
      url = url.slice(0, -8);
    }
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    const supabase = createBrowserClient(
      url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const processAuthCallback = async () => {
      try {
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const code = searchParams.get("code");

        // Si la URL contiene un token de invitación (#access_token=...) o código de autorización (?code=...)
        if (hash.includes("access_token") || code) {
          // CRÍTICO: Cerrar sesión previa de cualquier usuario activo en el navegador (ej. un administrador)
          // para evitar que la nueva invitación sobreescriba los datos del usuario equivocado.
          await supabase.auth.signOut();

          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          } else if (hash) {
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (setSessionError) throw setSessionError;
            }
          }
        }

        // Verificar la sesión resultante del nuevo usuario invitado
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/update-password");
        } else {
          router.push("/login");
        }
      } catch (err: any) {
        console.error("Error al procesar el callback de autenticación:", err);
        setErrorMsg(err.message || "Ocurrió un error al procesar la invitación.");
      }
    };

    processAuthCallback();
  }, [router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-md text-center">
          <h2 className="text-lg font-bold mb-2">Error de Invitación</h2>
          <p className="text-sm mb-4">{errorMsg}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all cursor-pointer"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        {/* Spinner de carga elegante */}
        <div className="w-12 h-12 border-4 border-golden-500 border-t-transparent rounded-full animate-spin" />
        
        {/* Textos de estado */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-golden-500">
            Validando invitación segura...
          </h1>
          <p className="text-sm text-gray-400">
            Te estamos redirigiendo para que crees tu contraseña
          </p>
        </div>
      </div>
    </div>
  );
}
