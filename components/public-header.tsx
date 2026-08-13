"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Menu, X, Home, Users, Zap } from "lucide-react";

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gold-500/20 bg-dark-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Marca */}
        <a href="#" className="flex items-center gap-2.5 sm:gap-3.5 group">
          <div className="relative h-8 w-8 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-xl border border-gold-400/40 bg-gray-950 p-0.5 shadow-[0_0_16px_rgba(212,175,55,0.3)] group-hover:border-gold-400 transition-all duration-300">
            <Image
              src="/logo.jpg"
              alt="Golden Express Logo"
              fill
              sizes="(max-width: 640px) 32px, 44px"
              className="object-cover rounded-lg"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-xl font-black tracking-tight text-gold-gradient uppercase leading-none">
              Golden Express
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold tracking-widest text-gold-400/80 uppercase mt-0.5">
              Velocidad y Confianza
            </span>
          </div>
        </a>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-semibold text-gray-300 hover:text-gold-400 transition-colors">
            Inicio
          </a>
          <a href="#repartidores" className="text-sm font-semibold text-gray-300 hover:text-gold-400 transition-colors">
            Repartidores
          </a>
          <span className="h-4 w-px bg-gray-800" />
          <a
            href="#repartidores"
            className="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-gold-500 via-gold-400 to-gold-600 px-3.5 py-1.5 text-xs font-black text-gray-950 hover:brightness-110 transition-all duration-300 shadow-[0_2px_12px_rgba(212,175,55,0.25)] cursor-pointer"
          >
            Pedir Ahora
          </a>
        </nav>

        {/* Acciones Móvil (Botón compacto + Botón Hamburguesa) */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href="#repartidores"
            className="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-gold-500 via-gold-400 to-gold-600 px-2.5 py-1 text-[11px] font-bold text-gray-950 hover:brightness-110 transition-all duration-200 shadow-sm cursor-pointer"
          >
            Pedir Ahora
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-gray-300 hover:text-gold-400 focus:outline-none rounded-lg bg-gray-900/60 border border-gray-800 active:scale-95 transition-all"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil (Overlay / Dropdown estilo premium) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gold-500/20 bg-dark-bg/98 backdrop-blur-xl px-4 pt-3 pb-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-2">
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:bg-gold-500/10 hover:text-gold-400 transition-all"
            >
              <Home className="w-4 h-4 text-gold-400" />
              <span>Inicio</span>
            </a>
            <a
              href="#repartidores"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:bg-gold-500/10 hover:text-gold-400 transition-all"
            >
              <Users className="w-4 h-4 text-gold-400" />
              <span>Repartidores Activos</span>
            </a>
            <a
              href="#repartidores"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-xs font-bold text-gold-400 mt-2 hover:bg-gold-500/20 transition-all"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold-400" />
                Pedir Delivery Express
              </span>
              <span className="text-[10px] bg-gold-500 text-gray-950 font-black px-2 py-0.5 rounded-md">VIP</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
