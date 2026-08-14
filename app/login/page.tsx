"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Shield, Sparkles, KeyRound, Mail, AlertTriangle, Loader2, X, Check, AlertCircle } from "lucide-react";
import { requestPasswordResetByEmail } from "@/app/actions/adminActions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Estado para el modal de recuperación de contraseña desde el Login
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const handleAuthTokensAndErrors = async () => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash ? window.location.hash.substring(1) : "";
      const searchParams = new URLSearchParams(window.location.search);
      const urlError = searchParams.get("error");

      // Si hay un token en el fragmento hash (flujo de invitación o recuperación)
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        const hashErrorDescription = hashParams.get("error_description");

        if (hashErrorDescription) {
          setError(decodeURIComponent(hashErrorDescription));
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }

        if (accessToken && refreshToken) {
          setValidatingInvite(true);
          setError(null);
          try {
            const supabase = createClient();
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              throw sessionError;
            }

            window.history.replaceState(null, "", window.location.pathname);

            if (type === "invite" || type === "recovery") {
              router.push("/update-password");
            } else {
              if (data.session?.user) {
                const { data: courier } = await supabase
                  .from("couriers")
                  .select("name, vehicle_info")
                  .eq("id", data.session.user.id)
                  .maybeSingle();

                if (!courier || !courier.name || !courier.vehicle_info) {
                  router.push("/register");
                } else {
                  router.push("/dashboard");
                }
              } else {
                router.push("/dashboard");
              }
            }
            router.refresh();
            return;
          } catch (err: any) {
            console.error("Error al validar sesión desde enlace de invitación:", err);
            setError(err.message || "El enlace de invitación ha expirado o no es válido.");
          } finally {
            setValidatingInvite(false);
          }
        }
      }

      if (urlError) {
        setError(urlError);
      }
    };

    handleAuthTokensAndErrors();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Error de inicio de sesión:", err);
      const isFetchError = err.message?.includes("Failed to fetch") || err.name === "AuthRetryableFetchError";
      setError(
        isFetchError
          ? "No se pudo establecer conexión con el servidor. Por favor, verifica tu conexión a internet o desactiva extensiones de privacidad/bloqueadores de anuncios (como Brave Shield o uBlock Origin) que puedan estar interceptando la petición."
          : (err.message || "Error al iniciar sesión. Verifica tus credenciales.")
      );
      setLoading(false);
    }
  };

  const handleOpenResetModal = () => {
    setResetEmail(email.trim());
    setResetFeedback(null);
    setIsResetModalOpen(true);
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetFeedback({ type: "error", message: "Por favor ingresa tu correo electrónico." });
      return;
    }

    setSendingReset(true);
    setResetFeedback(null);

    try {
      const result = await requestPasswordResetByEmail(resetEmail.trim());

      if (!result.success) {
        setResetFeedback({ type: "error", message: result.message });
        return;
      }

      setResetFeedback({ type: "success", message: result.message });
    } catch (err: any) {
      console.error("Error al solicitar recuperación de contraseña:", err);
      setResetFeedback({ type: "error", message: err.message || "Ocurrió un error al enviar el correo." });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-137.5 w-137.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 -z-10 h-75 w-75 rounded-full bg-gold-700/5 blur-[100px] pointer-events-none" />

      {/* Tarjeta de Login */}
      <div className="w-full max-w-md bg-dark-card border border-gold-500/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md">
        {/* Línea superior dorada */}
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold-400 via-gold-500 to-gold-600" />

        {/* Encabezado con Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-20 h-20 mb-4 rounded-2xl overflow-hidden border-2 border-gold-400/40 p-1 bg-gray-950 shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            <Image
              src="/logo.jpg"
              alt="Golden Express Logo"
              fill
              sizes="80px"
              className="object-cover rounded-xl"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-3.5 py-1 text-[11px] font-semibold text-gold-400 border border-gold-500/20 mb-3">
            <Sparkles className="w-3 h-3 text-gold-400" />
            <span>Portal de Repartidores Activos</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gold-gradient uppercase">
            Golden Express
          </h1>
          <p className="text-[11px] font-bold tracking-widest text-gold-400/90 uppercase mt-1">
            Velocidad y Confianza
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Ingresa tus credenciales para acceder a tu panel de entregas.
          </p>
        </div>

        {/* Pantalla de Carga durante Autenticación de Credenciales */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
              <Shield className="w-5 h-5 text-gold-400 absolute animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Iniciando Sesión...</h3>
              <p className="text-xs text-gray-400">Verificando credenciales en Golden Express</p>
            </div>
          </div>
        ) : validatingInvite ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
              <Sparkles className="w-5 h-5 text-gold-400 absolute animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Validando Enlace Seguro...</h3>
              <p className="text-xs text-gray-400">Comprobando credenciales para redirigirte</p>
            </div>
          </div>
        ) : (
          <>
            {/* Alerta de Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs mb-6 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Atención:</span> {error}
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@goldenexpress.com"
                    disabled={loading}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Contraseña con enlace de Olvidaste tu contraseña */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-[10px] font-semibold text-gold-400 hover:text-gold-300 transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-600 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)] disabled:opacity-55 disabled:cursor-not-allowed text-sm mt-2"
              >
                <Shield className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            </form>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-900 text-center">
          <p className="text-[10px] text-gray-500">
            © {new Date().getFullYear()} Golden Express. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Modal Dialog Form - Recuperación de Contraseña */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-dark-card border border-gold-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6.5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold-400 via-gold-500 to-gold-600" />

            <div className="flex items-center justify-between mb-4 pt-1">
              <h3 className="text-xs sm:text-sm font-bold text-gray-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-gold-500" />
                <span>Recuperar Contraseña</span>
              </h3>
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="text-gray-500 hover:text-gold-400 hover:bg-gray-800/40 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para crear tu nueva contraseña.
            </p>

            {resetFeedback && (
              <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs mb-4 animate-in fade-in duration-200 ${
                resetFeedback.type === "success" 
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {resetFeedback.type === "success" ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                )}
                <div>
                  <span className="font-semibold">
                    {resetFeedback.type === "success" ? "Correo Enviado:" : "Error:"}
                  </span>{" "}
                  {resetFeedback.message}
                </div>
              </div>
            )}

            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="ejemplo@goldenexpress.com"
                    disabled={sendingReset}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-900/60 mt-5">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 sm:py-2.5 rounded-xl border border-gray-800 text-gray-400 text-xs font-semibold hover:bg-gray-900/60 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={sendingReset}
                  className="bg-gold-500 text-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.15)] flex items-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                >
                  {sendingReset ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando correo...</span>
                    </>
                  ) : (
                    <span>Enviar Enlace</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
