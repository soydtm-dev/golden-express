"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  AlertCircle,
  Check,
  User,
  Phone,
  Car,
} from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const router = useRouter();

  useEffect(() => {
    const processSessionAndData = async () => {
      const supabase = createClient();

      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            window.history.replaceState(null, "", window.location.pathname);
          } catch (err) {
            console.error(
              "Error estableciendo sesión desde hash en update-password:",
              err,
            );
          }
        }
      }

      // Cargar datos preexistentes del perfil del usuario invitado autenticado
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          if (user.user_metadata?.name) setName(user.user_metadata.name);

          const { data: courier } = await supabase
            .from("couriers")
            .select("name, phone, vehicle_info")
            .eq("id", user.id)
            .maybeSingle();

          if (courier) {
            if (courier.name) setName(courier.name);
            if (courier.phone && courier.phone !== "Sin registro") setPhone(courier.phone);
            if (courier.vehicle_info && courier.vehicle_info !== "Sin especificar") setVehicleInfo(courier.vehicle_info);
          }
        }
      } catch (e) {
        console.error("Error al obtener perfil preexistente:", e);
      }
    };

    processSessionAndData();
  }, []);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      showToastMessage("Por favor, ingresa tu nueva contraseña.", "error");
      return;
    }

    if (password.length < 6) {
      showToastMessage(
        "La contraseña debe tener al menos 6 caracteres.",
        "error",
      );
      return;
    }

    if (!name.trim()) {
      showToastMessage("Por favor, ingresa tu nombre completo.", "error");
      return;
    }

    if (!phone.trim()) {
      showToastMessage("Por favor, ingresa tu número de teléfono.", "error");
      return;
    }

    if (!vehicleInfo.trim()) {
      showToastMessage(
        "Por favor, ingresa la información de tu vehículo.",
        "error",
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Actualizar la contraseña en Supabase Auth para la cuenta invitada activa
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
        data: { name: name.trim() },
      });

      if (authError) {
        throw authError;
      }

      // 2. Obtener el usuario autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "No se pudo verificar la sesión actual del usuario. Por favor vuelve a abrir el enlace de tu correo.",
        );
      }

      // 3. Preparar datos para la tabla 'couriers' del usuario invitado (id = user.id)
      const courierPayload: Record<string, any> = {
        id: user.id,
        name: name.trim(),
        phone: phone.trim(),
        vehicle_info: vehicleInfo.trim(),
        status: "desconectado",
      };

      if (typeof user.user_metadata?.is_admin === "boolean") {
        courierPayload.is_admin = user.user_metadata.is_admin;
      }

      let { error: profileError } = await supabase
        .from("couriers")
        .upsert(courierPayload, { onConflict: "id" });

      // Si ocurrió un error y contenía is_admin (posible restricción de RLS), reintentar sin is_admin
      if (profileError && courierPayload.is_admin !== undefined) {
        console.warn(
          "Reintentando upsert de courier sin el campo is_admin debido a aviso de permisos:",
          profileError,
        );
        delete courierPayload.is_admin;
        const retryResult = await supabase
          .from("couriers")
          .upsert(courierPayload, { onConflict: "id" });
        profileError = retryResult.error;
      }

      if (profileError) {
        throw profileError;
      }

      showToastMessage(
        "¡Perfil y contraseña guardados con éxito! Redirigiendo...",
        "success",
      );

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      const detailedMessage =
        err?.message ||
        err?.error_description ||
        err?.details ||
        err?.hint ||
        (typeof err === "string" ? err : JSON.stringify(err));

      console.error("Error al actualizar la cuenta:", detailedMessage, err);

      const isFetchError =
        typeof detailedMessage === "string" &&
        (detailedMessage.includes("Failed to fetch") ||
          err?.name === "AuthRetryableFetchError");

      let userFriendlyMsg = detailedMessage;
      if (typeof detailedMessage === "string") {
        const lower = detailedMessage.toLowerCase();
        if (lower.includes("new password should be different")) {
          userFriendlyMsg =
            "La nueva contraseña debe ser diferente a tu contraseña anterior.";
        } else if (lower.includes("password should be at least")) {
          userFriendlyMsg = "La contraseña debe tener al menos 6 caracteres.";
        } else if (
          lower.includes("auth session missing") ||
          lower.includes("session_not_found")
        ) {
          userFriendlyMsg =
            "Tu sesión ha expirado. Por favor vuelve a abrir el enlace de tu correo o solicita una nueva invitación.";
        } else if (
          lower.includes("token has expired") ||
          lower.includes("otp_expired")
        ) {
          userFriendlyMsg =
            "El enlace de invitación ha expirado. Por favor solicita un nuevo enlace.";
        }
      }

      showToastMessage(
        isFetchError
          ? "No se pudo establecer conexión con el servidor. Verifica tu conexión a internet o desactiva extensiones de privacidad/bloqueadores de anuncios (como Brave Shield)."
          : userFriendlyMsg && userFriendlyMsg !== "{}"
            ? userFriendlyMsg
            : "Error al actualizar la cuenta. Por favor, verifica que tu sesión no haya expirado.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas premium */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 -z-10 h-75 w-75 rounded-full bg-gold-700/5 blur-[100px] pointer-events-none" />

      {/* Tarjeta de Activación de Cuenta */}
      <div className="w-full max-w-lg bg-dark-card border border-gold-500/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md">
        {/* Línea superior dorada decorativa */}
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold-400 via-gold-500 to-gold-600" />

        {/* Encabezado */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-16 h-16 mb-3 rounded-2xl overflow-hidden border border-gold-400/40 p-0.5 bg-gray-950 shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Image
              src="/logo.jpg"
              alt="Golden Express"
              fill
              sizes="64px"
              className="object-cover rounded-xl"
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-3.5 py-1 text-[11px] font-semibold text-gold-400 border border-gold-500/20 mb-3">
            <Sparkles className="w-3 h-3" />
            <span>Configuración de Cuenta</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gold-gradient uppercase mb-1">
            Golden Express
          </h1>
          <p className="text-xs text-gray-400">
            Crea tu contraseña y completa los datos de tu perfil para activar tu
            cuenta.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {/* Contraseña */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Nueva Contraseña <span className="text-gold-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Nombre Completo <span className="text-gold-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Pedro Fernández"
                disabled={loading}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Número de Teléfono */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Número de Teléfono <span className="text-gold-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ej. +52 55 1234 5678"
                disabled={loading}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Información del Vehículo */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Detalles del Vehículo <span className="text-gold-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                <Car className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                placeholder="ej. Motocicleta Suzuki - Placa 5678"
                disabled={loading}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Botón de Enviar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-600 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)] disabled:opacity-55 disabled:cursor-not-allowed text-xs font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando perfil...</span>
                </>
              ) : (
                <span>Activar Cuenta y Guardar</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Alerta Toast Flotante Premium */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2.5 shadow-lg animate-in slide-in-from-bottom duration-300 ${
            toast.type === "success"
              ? "bg-emerald-500 text-gray-950 shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
              : "bg-red-500 text-gray-100 shadow-[0_4px_20px_rgba(239,68,68,0.35)]"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
