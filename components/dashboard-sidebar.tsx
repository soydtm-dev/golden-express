"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { LogOut, Package, History, UserCircle, Settings, Users, Menu, X } from "lucide-react";

import StateSelector from "@/components/state-selector";

interface DashboardSidebarProps {
  isAdmin: boolean;
}

export default function DashboardSidebar({ isAdmin }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    const base = "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer";
    if (isActive) {
      return `${base} font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-[0_2px_8px_rgba(245,158,11,0.05)]`;
    }
    return `${base} font-medium text-gray-400 hover:text-gray-250 hover:bg-gray-900/40 border border-transparent`;
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Cabecera / Logo */}
        <Link 
          href="/dashboard" 
          onClick={() => setMobileOpen(false)} 
          className="flex items-center gap-3 mb-8 pl-1 group"
        >
          <div className="relative w-9 h-9 shrink-0 rounded-xl overflow-hidden border border-gold-400/40 bg-gray-950 p-0.5 shadow-[0_0_12px_rgba(212,175,55,0.25)] group-hover:border-gold-400 transition-all duration-300">
            <Image
              src="/logo.jpg"
              alt="Golden Express"
              fill
              sizes="36px"
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight text-gold-gradient uppercase leading-none">
              Golden Express
            </span>
            <span className="text-[9px] font-bold tracking-widest text-gold-400/80 uppercase mt-0.5">
              Panel de Control
            </span>
          </div>
        </Link>

        {/* Menú de Navegación */}
        <nav className="space-y-1.5">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-2 mb-2 block">
            Entregas
          </div>
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={getLinkClass("/dashboard")}
          >
            <Package className="w-4 h-4 shrink-0 text-gold-400" />
            <span>Pedidos Activos</span>
          </Link>
          <Link
            href="/dashboard/history"
            onClick={() => setMobileOpen(false)}
            className={getLinkClass("/dashboard/history")}
          >
            <History className="w-4 h-4 shrink-0 text-gold-400" />
            <span>Historial de Envíos</span>
          </Link>

          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-2 pt-6 mb-2 block">
            Configuración
          </div>
          <Link
            href="/dashboard/profile"
            onClick={() => setMobileOpen(false)}
            className={getLinkClass("/dashboard/profile")}
          >
            <UserCircle className="w-4 h-4 shrink-0 text-gold-400" />
            <span>Mi Perfil</span>
          </Link>
          <a
            href="#ajustes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-600 border border-transparent pointer-events-none cursor-not-allowed select-none"
          >
            <Settings className="w-4 h-4 shrink-0 text-gray-600" />
            <span>Ajustes de Cuenta</span>
          </a>

          {/* Enlace condicional de Administración */}
          {isAdmin && (
            <>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-2 pt-6 mb-2 block">
                Administración
              </div>
              <Link
                href="/dashboard/admin/users"
                onClick={() => setMobileOpen(false)}
                className={getLinkClass("/dashboard/admin/users")}
              >
                <Users className="w-4 h-4 shrink-0 text-gold-500" />
                <span className="font-semibold text-gold-450">Gestión de Personal</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Sección de Salida */}
      <div className="pt-4 border-t border-gray-900 mt-auto">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900/40 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-gray-800/80 hover:border-red-500/20 rounded-xl transition-all cursor-pointer font-bold text-xs"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Barra Superior Móvil (Visible solo en pantallas < md) */}
      <div className="md:hidden relative z-40 flex items-center justify-between px-4 py-3 bg-dark-card border-b border-gray-900 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-gold-400/40 bg-gray-950 p-0.5">
            <Image src="/logo.jpg" alt="Golden Express" fill sizes="28px" className="object-cover" />
          </div>
          <span className="font-black text-xs tracking-tight text-gold-gradient uppercase">
            Golden Express
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <StateSelector />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-gray-300 hover:text-gold-400 focus:outline-none rounded-lg bg-gray-900 border border-gray-800 active:scale-95 transition-all"
            aria-label="Toggle Dashboard Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. Menú Desplegable Drawer Móvil (Overlay en pantallas < md) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Fondo oscuro traslúcido */}
          <div 
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel lateral deslizante */}
          <div className="relative w-72 max-w-[80vw] bg-dark-card border-r border-gray-900 p-6 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gold-400 p-1.5 rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            {navContent}
          </div>
        </div>
      )}

      {/* 3. Sidebar Estático Desktop (Visible solo en pantallas md:flex) */}
      <aside className="hidden md:flex w-64 bg-dark-card border-r border-gray-900 flex-col justify-between p-6 shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.15)]">
        {navContent}
      </aside>
    </>
  );
}
