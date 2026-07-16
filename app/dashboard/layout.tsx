import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardSidebar from "@/components/dashboard-sidebar";
import StateSelector from "@/components/state-selector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Obtener la sesión del usuario en el servidor
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Consultar si el repartidor autenticado tiene rol de administrador
  const { data: courier, error } = await supabase
    .from("couriers")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = !error && !!courier?.is_admin;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Sidebar (Componente Cliente con enlaces y prop isAdmin) */}
      <DashboardSidebar isAdmin={isAdmin} />

      {/* 2. Área de Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-950 overflow-hidden relative">
        {/* Cabecera del Dashboard */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-5 border-b border-gray-900 bg-dark-card/40 backdrop-blur-md shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Panel de Control</h1>
            <p className="text-xs text-gray-400 mt-0.5">Gestión de entregas activas y chat en vivo</p>
          </div>
          
          {/* Selector de Estado */}
          <StateSelector />
        </header>

        {/* Cuerpo del Contenido (Hijos) */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
