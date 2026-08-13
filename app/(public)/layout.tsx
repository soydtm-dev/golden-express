import React from "react";
import Image from "next/image";
import ChatPanel from "@/components/chat-panel";
import PublicHeader from "@/components/public-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Navbar Público */}
      <PublicHeader />

      {/* Contenido Principal Público */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer Público */}
      <footer className="border-t border-gold-500/10 bg-dark-bg/60 py-6 sm:py-8 mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 overflow-hidden rounded-md border border-gold-400/30 shrink-0">
              <Image src="/logo.jpg" alt="Golden Express" fill sizes="24px" className="object-cover" />
            </div>
            <p>&copy; {new Date().getFullYear()} Golden Express. Todos los derechos reservados.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a href="#" className="hover:text-gold-400 transition-colors">Términos</a>
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
