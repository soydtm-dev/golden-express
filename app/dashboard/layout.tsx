import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardSidebar from "@/components/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard-header";

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
    <div className="flex flex-col md:flex-row h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Sidebar (Componente Cliente con enlaces y prop isAdmin) */}
      <DashboardSidebar isAdmin={isAdmin} />

      {/* 2. Área de Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-950 overflow-hidden relative">
        {/* Cabecera del Dashboard Dinámica */}
        <DashboardHeader />

        {/* Cuerpo del Contenido (Hijos) */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
