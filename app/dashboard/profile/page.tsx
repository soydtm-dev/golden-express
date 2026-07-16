"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Car, 
  Phone,
  Save, 
  Loader2, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Toast notifications state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  // 1. Fetch courier profile data
  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data, error } = await supabase
          .from("couriers")
          .select("name, vehicle_info, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setName(data.name || "");
          setVehicleInfo(data.vehicle_info || "");
          setPhone(data.phone || "");
        }
      } catch (err: any) {
        console.error("Error al cargar perfil:", err);
        showToast("Error al obtener los datos del perfil.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // 2. Save / Update courier profile data
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!name.trim() || !vehicleInfo.trim() || !phone.trim()) {
      showToast("Por favor, completa todos los campos requeridos.", "error");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("couriers")
        .update({
          name: name.trim(),
          vehicle_info: vehicleInfo.trim(),
          phone: phone.trim()
        })
        .eq("id", userId);

      if (error) throw error;

      showToast("Perfil actualizado correctamente.", "success");
    } catch (err: any) {
      console.error("Error al actualizar perfil:", err);
      showToast(err.message || "No se pudieron guardar los cambios.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto h-full overflow-y-auto scrollbar-thin">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <User className="w-5 h-5 text-gold-500" />
          <span>Mi Perfil de Repartidor</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Actualiza tu nombre de contacto y los detalles del vehículo de entregas asignado.
        </p>
      </div>

      {loading ? (
        /* Estado de Carga */
        <div className="bg-gray-800/40 border border-gray-700/30 rounded-3xl p-8 backdrop-blur-md flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <span className="text-xs text-gray-400 font-medium">Cargando datos de perfil...</span>
        </div>
      ) : (
        /* Tarjeta de Formulario */
        <div className="bg-gray-800/40 border border-gray-700/30 rounded-3xl p-8 backdrop-blur-md shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Línea decorativa superior */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Input Nombre */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-xs text-gray-150 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/10 transition-all"
                />
              </div>
            </div>

            {/* Input Teléfono */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Número de Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +52 55 1234 5678"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-xs text-gray-150 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/10 transition-all"
                />
              </div>
            </div>

            {/* Input Vehículo */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Información del Vehículo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                  <Car className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="Ej. Motocicleta Honda - Placa 1234"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-xs text-gray-150 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/10 transition-all"
                />
              </div>
              <p className="text-[9px] text-gray-550 pl-1 mt-1">
                Consejo: Indica el tipo (moto, bici, auto) para que el icono del mapa coincida.
              </p>
            </div>

            {/* Botón de Enviar */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-gold-500 text-gray-900 px-6 py-3 rounded-xl text-xs font-bold hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.2)] disabled:opacity-55 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-gray-900" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerta Toast Flotante */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2.5 shadow-lg animate-in slide-in-from-bottom duration-300 ${
          toast.type === "success" 
            ? "bg-emerald-500 text-gray-950 shadow-[0_4px_20px_rgba(16,185,129,0.35)]" 
            : "bg-red-500 text-gray-100 shadow-[0_4px_20px_rgba(239,68,68,0.35)]"
        }`}>
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
