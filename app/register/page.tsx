"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  User, 
  Phone,
  Car, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  LogOut,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export default function RegisterPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const loadUserData = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login?error=Debes iniciar sesión para completar tu registro");
          return;
        }

        setUserId(user.id);
        setEmail(user.email || "");

        if (user.user_metadata?.name) {
          setName(user.user_metadata.name);
        }

        const { data: courier } = await supabase
          .from("couriers")
          .select("name, phone, vehicle_info")
          .eq("id", user.id)
          .maybeSingle();

        if (courier) {
          if (courier.name) setName(courier.name);
          if (courier.phone) setPhone(courier.phone);
          if (courier.vehicle_info) setVehicleInfo(courier.vehicle_info);
        }
      } catch (err: any) {
        console.error("Error al cargar datos del usuario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      showToast("Sesión no válida. Por favor vuelve a ingresar.", "error");
      return;
    }

    if (!name.trim() || !phone.trim() || !vehicleInfo.trim()) {
      showToast("Por favor completa todos los campos obligatorios.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("couriers")
        .upsert(
          {
            id: userId,
            name: name.trim(),
            phone: phone.trim(),
            vehicle_info: vehicleInfo.trim(),
            status: "desconectado"
          },
          { onConflict: "id" }
        );

      if (error) throw error;

      showToast("¡Registro completado exitosamente! Redirigiendo...", "success");

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error("Error al guardar registro:", err);
      showToast(err.message || "Ocurrió un error al guardar tus datos de registro.", "error");
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Resplandores decorativos de fondo */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-137.5 w-137.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 -z-10 h-80 w-80 rounded-full bg-gold-700/5 blur-[110px] pointer-events-none" />

      {/* Tarjeta del Formulario de Registro */}
      <div className="w-full max-w-lg bg-dark-card border border-gold-500/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md">
        {/* Adorno superior dorado */}
        <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold-400 via-gold-500 to-gold-600" />

        {/* Header */}
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Completar Registro de Repartidor</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gold-gradient uppercase">
            Golden Express
          </h1>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
            Por favor ingresa tu información personal y los datos de tu vehículo para habilitar tu cuenta.
          </p>
          {email && (
            <div className="mt-3 inline-block bg-gray-900/80 border border-gold-500/20 rounded-full px-3 py-1 text-[11px] text-gray-400">
              Cuenta: <span className="text-gold-300 font-medium">{email}</span>
            </div>
          )}
        </div>

        {submitting ? (
          /* Pantalla de Carga durante el envío de datos */
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
              <ShieldCheck className="w-5 h-5 text-gold-400 absolute animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Guardando Registro...</h3>
              <p className="text-xs text-gray-400">Habilitando tu cuenta de repartidor en Golden Express</p>
            </div>
          </div>
        ) : loading ? (
          /* Pantalla de Carga inicial */
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
              <Loader2 className="w-5 h-5 text-gold-400 absolute animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Verificando Cuenta...</h3>
              <p className="text-xs text-gray-400">Cargando datos de perfil</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Campo Nombre Completo */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Nombre Completo <span className="text-gold-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  disabled={submitting}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo Número de Teléfono */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Número de Teléfono <span className="text-gold-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +52 55 1234 5678"
                  disabled={submitting}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo Información del Vehículo */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Información del Vehículo <span className="text-gold-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                  <Car className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="Ej. Motocicleta Yamaha FZ - Placa ABC-123"
                  disabled={submitting}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-[10px] text-gray-500 pl-1">
                Especifica el tipo de vehículo (moto, bicicleta, automóvil) y matrícula si aplica.
              </p>
            </div>

            {/* Botones */}
            <div className="pt-3 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gold-500 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-600 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)] disabled:opacity-55 disabled:cursor-not-allowed text-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Completar Registro e Ingresar</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={submitting}
                className="w-full bg-transparent text-gray-500 hover:text-gray-300 text-xs py-2 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión e ingresar con otra cuenta</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Alerta Toast Flotante */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2.5 shadow-lg animate-in slide-in-from-bottom duration-300 ${
          toast.type === "success" 
            ? "bg-emerald-500 text-gray-950 shadow-[0_4px_20px_rgba(16,185,129,0.35)]" 
            : "bg-red-500 text-gray-100 shadow-[0_4px_20px_rgba(239,68,68,0.35)]"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
