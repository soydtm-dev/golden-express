import React from "react";
import Image from "next/image";
import ChatPanel from "@/components/chat-panel";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Navbar Público */}
      <header className="sticky top-0 z-40 w-full border-b border-gold-500/20 bg-dark-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3.5 group">
            {/* Logo de la empresa */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-gold-400/40 bg-gray-950 p-0.5 shadow-[0_0_16px_rgba(212,175,55,0.3)] group-hover:border-gold-400 transition-all duration-300">
              <Image
                src="/logo.jpg"
                alt="Golden Express Logo"
                fill
                sizes="44px"
                className="object-cover rounded-lg"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-gold-gradient uppercase leading-none">
                Golden Express
              </span>
              <span className="text-[10px] font-bold tracking-widest text-gold-400/80 uppercase mt-0.5">
                Velocidad y Confianza
              </span>
            </div>
          </a>
          
          {/* Navegación */}
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm font-semibold text-gray-300 hover:text-gold-400 transition-colors">Inicio</a>
            <a href="#repartidores" className="text-sm font-semibold text-gray-300 hover:text-gold-400 transition-colors">Repartidores</a>
            <span className="h-4 w-px bg-gray-800 hidden sm:inline" />
            <button className="hidden sm:inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 px-4 py-2 text-xs font-black text-gray-950 hover:brightness-110 transition-all duration-300 shadow-[0_2px_12px_rgba(212,175,55,0.25)] cursor-pointer">
              Pedir Ahora
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido Principal Público */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer Público */}
      <footer className="border-t border-gold-500/10 bg-dark-bg/60 py-8 mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 overflow-hidden rounded-md border border-gold-400/30">
              <Image src="/logo.jpg" alt="Golden Express" fill sizes="24px" className="object-cover" />
            </div>
            <p>&copy; {new Date().getFullYear()} Golden Express. Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gold-400 transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Contacto</a>
          </div>
        </div>
      </footer>

      {/* Panel de Chat Flotante Público */}
      <ChatPanel />
    </>
  );
}
