"use client";

import React from "react";
import { usePathname } from "next/navigation";
import StateSelector from "@/components/state-selector";

export default function DashboardHeader() {
  const pathname = usePathname();

  const getHeaderInfo = (path: string) => {
    if (path === "/dashboard/history") {
      return {
        title: "Historial de Envíos",
        subtitle: "Registro de entregas completadas y coordinadas"
      };
    }
    if (path === "/dashboard/profile") {
      return {
        title: "Mi Perfil",
        subtitle: "Configuración de tu cuenta y vehículo asignado"
      };
    }
    if (path.startsWith("/dashboard/admin")) {
      return {
        title: "Gestión de Personal",
        subtitle: "Administración de roles y miembros del equipo"
      };
    }
    // Por defecto en /dashboard
    return {
      title: "Pedidos Activos",
      subtitle: "Gestión de entregas activas y chat en vivo"
    };
  };

  const headerInfo = getHeaderInfo(pathname);

  return (
    <header className="relative z-50 flex flex-row items-center justify-between gap-2.5 px-4 sm:px-8 py-3 sm:py-4 border-b border-gray-900 bg-dark-card/40 backdrop-blur-md shrink-0">
      <div>
        <h1 className="text-sm sm:text-lg font-bold text-gray-100 transition-all duration-200">
          {headerInfo.title}
        </h1>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden xs:block">
          {headerInfo.subtitle}
        </p>
      </div>

      {/* Selector de Estado en escritorio */}
      <div className="hidden md:block">
        <StateSelector />
      </div>
    </header>
  );
}
