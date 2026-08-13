"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Courier } from "@/types";
import { Loader2, ChevronDown, Check } from "lucide-react";

export default function StateSelector() {
  const [status, setStatus] = useState<Courier["status"]>("disponible");
  const [loading, setLoading] = useState(true);
  const [updatingTo, setUpdatingTo] = useState<Courier["status"] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intentar cargar estado persistido localmente
    const savedStatus = typeof window !== "undefined" ? (localStorage.getItem("courier_status") as Courier["status"] | null) : null;
    if (savedStatus && ["disponible", "ocupado", "desconectado"].includes(savedStatus)) {
      setStatus(savedStatus);
    }

    const supabase = createClient();

    const fetchCurrentStatus = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("couriers")
            .select("status")
            .eq("id", user.id)
            .maybeSingle();

          if (!error && data?.status) {
            setStatus(data.status);
            if (typeof window !== "undefined") {
              localStorage.setItem("courier_status", data.status);
            }
          }
        }
      } catch (err) {
        console.error("Error al obtener el estado inicial del repartidor:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentStatus();
  }, []);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: Courier["status"]) => {
    setIsOpen(false);
    if (newStatus === status) return;

    // Actualización optimista de la UI y persistencia local
    setStatus(newStatus);
    if (typeof window !== "undefined") {
      localStorage.setItem("courier_status", newStatus);
      window.dispatchEvent(new CustomEvent("courier-status-changed", { detail: newStatus }));
    }

    setUpdatingTo(newStatus);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("couriers")
          .update({ status: newStatus })
          .eq("id", user.id);
      }
    } catch (err) {
      console.error("Error al actualizar el estado en Supabase:", err);
    } finally {
      setUpdatingTo(null);
    }
  };

  const getStatusConfig = (st: Courier["status"] | null) => {
    switch (st) {
      case "disponible":
        return {
          label: "Disponible",
          badgeClass: "bg-emerald-950/80 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900/80 shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/30",
          dotClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse",
          optionActiveBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]",
          checkColor: "text-emerald-400",
        };
      case "ocupado":
        return {
          label: "Ocupado",
          badgeClass: "bg-amber-950/80 text-amber-400 border-amber-500/50 hover:bg-amber-900/80 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/30",
          dotClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
          optionActiveBg: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]",
          checkColor: "text-amber-400",
        };
      case "desconectado":
      default:
        return {
          label: "No Disponible",
          badgeClass: "bg-rose-950/80 text-rose-400 border-rose-500/50 hover:bg-rose-900/80 shadow-[0_0_12px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/30",
          dotClass: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
          optionActiveBg: "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold shadow-[0_0_10px_rgba(244,63,94,0.15)]",
          checkColor: "text-rose-400",
        };
    }
  };

  const currentConfig = getStatusConfig(status);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-[11px] text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin text-gold-500" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Botón Principal Selector de Estado */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!!updatingTo}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer active:scale-95 ${currentConfig.badgeClass}`}
      >
        {updatingTo ? (
          <Loader2 className="w-3 h-3 animate-spin text-gold-400" />
        ) : (
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${currentConfig.dotClass}`} />
        )}
        <span>{updatingTo ? "Guardando..." : currentConfig.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Menú Desplegable con Opciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-dark-card/95 border border-gray-800 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider px-2.5 py-1.5">
            Cambiar Disponibilidad
          </div>

          {/* Opciones */}
          <div className="space-y-1 mt-1">
            {/* Disponible */}
            <button
              type="button"
              onClick={() => handleStatusChange("disponible")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === "disponible"
                  ? getStatusConfig("disponible").optionActiveBg
                  : "text-gray-300 hover:bg-gray-800/70"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
                <span>Disponible</span>
              </div>
              {status === "disponible" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Ocupado */}
            <button
              type="button"
              onClick={() => handleStatusChange("ocupado")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === "ocupado"
                  ? getStatusConfig("ocupado").optionActiveBg
                  : "text-gray-300 hover:bg-gray-800/70"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                <span>Ocupado</span>
              </div>
              {status === "ocupado" && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            {/* No Disponible */}
            <button
              type="button"
              onClick={() => handleStatusChange("desconectado")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === "desconectado"
                  ? getStatusConfig("desconectado").optionActiveBg
                  : "text-gray-300 hover:bg-gray-800/70"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                <span>No Disponible</span>
              </div>
              {status === "desconectado" && <Check className="w-3.5 h-3.5 text-rose-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
