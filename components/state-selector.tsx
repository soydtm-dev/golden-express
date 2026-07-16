"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Courier } from "@/types";
import { Loader2 } from "lucide-react";

export default function StateSelector() {
  const [status, setStatus] = useState<Courier["status"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTo, setUpdatingTo] = useState<Courier["status"] | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchCurrentStatus = async () => {
      try {
        setLoading(true);
        // 1. Obtener la sesión activa para extraer el ID de usuario autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // 2. Consultar el estado del repartidor en la base de datos (usando maybeSingle para evitar error PGRST116 si no hay perfil)
        const { data, error } = await supabase
          .from("couriers")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setStatus(data.status);
        } else {
          // Si el usuario existe pero no tiene un perfil de repartidor creado en la base de datos,
          // establecemos por defecto desconectado para evitar bloquear la UI
          setStatus("desconectado");
        }
      } catch (err) {
        console.error("Error al obtener el estado inicial del repartidor:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentStatus();
  }, []);

  const handleStatusChange = async (newStatus: Courier["status"]) => {
    if (newStatus === status || updatingTo) return;

    setUpdatingTo(newStatus);
    try {
      const supabase = createClient();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Actualizar el estado del repartidor en Supabase
      const { error } = await supabase
        .from("couriers")
        .update({ status: newStatus })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setStatus(newStatus);
    } catch (err) {
      console.error("Error al actualizar el estado del repartidor:", err);
    } finally {
      setUpdatingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-900 border border-gray-800 text-xs text-gray-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-500" />
        <span>Cargando estado...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1 block">
        Tu Estado
      </span>
      <div className="inline-flex p-1 bg-gray-950 border border-gray-800/80 rounded-2xl gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        {/* Disponible */}
        <button
          onClick={() => handleStatusChange("disponible")}
          disabled={!!updatingTo}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            status === "disponible"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_2px_8px_rgba(16,185,129,0.1)]"
              : "text-gray-500 border border-transparent hover:text-gray-300 hover:bg-gray-900/40"
          }`}
        >
          {updatingTo === "disponible" ? (
            <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
          ) : (
            <span className={`w-2 h-2 rounded-full bg-emerald-500 ${status === "disponible" ? "animate-pulse" : ""}`} />
          )}
          <span>Disponible</span>
        </button>

        {/* Ocupado */}
        <button
          onClick={() => handleStatusChange("ocupado")}
          disabled={!!updatingTo}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            status === "ocupado"
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_2px_8px_rgba(249,115,22,0.1)]"
              : "text-gray-500 border border-transparent hover:text-gray-300 hover:bg-gray-900/40"
          }`}
        >
          {updatingTo === "ocupado" ? (
            <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          )}
          <span>Ocupado</span>
        </button>

        {/* Desconectado */}
        <button
          onClick={() => handleStatusChange("desconectado")}
          disabled={!!updatingTo}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            status === "desconectado"
              ? "bg-gray-700/20 text-gray-400 border border-gray-650 shadow-none"
              : "text-gray-500 border border-transparent hover:text-gray-300 hover:bg-gray-900/40"
          }`}
        >
          {updatingTo === "desconectado" ? (
            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-gray-500" />
          )}
          <span>Desconectado</span>
        </button>
      </div>
    </div>
  );
}
