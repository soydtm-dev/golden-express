"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();

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

    // Listener para procesar en segundo plano el hash fragment #access_token de la URL
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        router.push("/update-password");
      }
    });

    // Fallback con getSession por si el evento de cambio de estado se dispara antes de montar el listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/update-password");
      }
    });

    // Limpiar suscripción al desmontar el componente para evitar fugas de memoria
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

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
