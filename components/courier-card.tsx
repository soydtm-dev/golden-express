"use client";

import React from "react";
import { Motorbike, Bike, Car, MessageSquare } from "lucide-react";
import { Courier } from "@/types";

interface CourierCardProps {
  courier: Courier;
}

export default function CourierCard({ courier }: CourierCardProps) {
  // Función para obtener el icono correcto según la información del vehículo
  const getVehicleIcon = (vehicleInfo: string) => {
    const info = vehicleInfo.toLowerCase();
    if (info.includes("moto") || info.includes("scooter") || info.includes("motorcycle") || info.includes("vespa")) {
      return <Motorbike className="w-5 h-5 text-gold-400" />;
    }
    if (info.includes("bici") || info.includes("bicycle") || info.includes("bicicleta")) {
      return <Bike className="w-5 h-5 text-gold-400" />;
    }
    if (info.includes("car") || info.includes("auto") || info.includes("carro") || info.includes("coche") || info.includes("automóvil")) {
      return <Car className="w-5 h-5 text-gold-400" />;
    }
    return <Car className="w-5 h-5 text-gold-400" />; // Icono genérico por defecto
  };

  // Configuración del badge de estado
  const getStatusConfig = (status: Courier["status"]) => {
    switch (status) {
      case "disponible":
        return {
          label: "Disponible",
          badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          dotClass: "bg-emerald-500 animate-pulse",
        };
      case "ocupado":
        return {
          label: "Ocupado",
          badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          dotClass: "bg-orange-500",
        };
      case "desconectado":
        return {
          label: "Desconectado",
          badgeClass: "bg-gray-500/10 text-gray-400 border-gray-700/50",
          dotClass: "bg-gray-500",
        };
      default:
        return {
          label: status,
          badgeClass: "bg-gray-500/10 text-gray-400 border-gray-700/50",
          dotClass: "bg-gray-500",
        };
    }
  };

  const statusConfig = getStatusConfig(courier.status);

  const handleStartChat = () => {
    if (courier.status === "desconectado") return;
    // Despachar evento para que el panel de chat capture la información del repartidor
    const event = new CustomEvent("open-chat", {
      detail: { courier }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="group relative bg-dark-card border border-gray-800 hover:border-gold-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(245,158,11,0.06)] flex flex-col justify-between h-56 overflow-hidden">
      {/* Luz de fondo sutil al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/0 via-gold-500/0 to-gold-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div>
        {/* Fila superior: Estado e Iniciales */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center font-bold text-gold-500 border border-gray-700/50">
            {courier.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Info del Repartidor */}
        <h3 className="text-lg font-bold text-gray-100 group-hover:text-gold-400 transition-colors duration-200">
          {courier.name}
        </h3>
        
        <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
          {getVehicleIcon(courier.vehicle_info)}
          <span className="truncate max-w-[200px]" title={courier.vehicle_info}>
            {courier.vehicle_info}
          </span>
        </div>
      </div>

      {/* Botón de Chat */}
      <button
        onClick={handleStartChat}
        disabled={courier.status === "desconectado"}
        className={`w-full font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-4 border ${
          courier.status === "desconectado"
            ? "bg-gray-800/40 text-gray-500 border-gray-800 cursor-not-allowed shadow-none"
            : "bg-gold-500 text-gray-900 border-gold-500 hover:bg-gold-600 cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
        }`}
      >
        <MessageSquare className="w-4 h-4 font-bold" />
        <span>{courier.status === "desconectado" ? "No Disponible" : "Iniciar Chat"}</span>
      </button>
    </div>
  );
}
