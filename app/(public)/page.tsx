import React from "react";
import Image from "next/image";
import CourierGrid from "@/components/courier-grid";
import { Shield, Sparkles, Zap, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="relative overflow-hidden pb-12 sm:pb-16">
      {/* Luces de fondo decorativas (Glow premium) */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-70 w-[320px] sm:h-112.5 sm:w-162.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[90px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-5 sm:right-10 -z-10 h-45 w-45 sm:h-75 sm:w-75 rounded-full bg-gold-700/5 blur-[70px] sm:blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-12 pb-10 sm:pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 sm:gap-12 text-center lg:text-left">
          <div className="max-w-2xl w-full">
            {/* Badge pequeño premium */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-gold-400 border border-gold-500/25 mb-4 sm:mb-6 max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span className="truncate">Servicio de Delivery Local Exclusivo</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-100 leading-[1.15] sm:leading-[1.1]">
              Entregas <span className="text-gold-gradient">rápidas y seguras</span> al instante
            </h1>

            {/* Subtítulo */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Conecta en tiempo real con nuestra flota selecta de repartidores locales. 
              Llevamos tus paquetes, comida y compras a tu puerta con la máxima confianza y velocidad.
            </p>

            {/* Características destacadas */}
            <div className="mt-5 sm:mt-8 flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-4 text-[11px] sm:text-sm font-semibold text-gray-200">
              <div className="flex items-center gap-1.5 sm:gap-2.5 bg-dark-card/80 border border-gold-500/20 px-3 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl shadow-sm">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-400 shrink-0" />
                <span>Velocidad Express</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2.5 bg-dark-card/80 border border-gold-500/20 px-3 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl shadow-sm">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-400 shrink-0" />
                <span>Confianza Garantizada</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2.5 bg-dark-card/80 border border-gold-500/20 px-3 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl shadow-sm">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-400 shrink-0" />
                <span>Servicio VIP</span>
              </div>
            </div>
          </div>

          {/* Logo Showcase Emblem */}
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-gold-400 via-gold-500 to-gold-700 opacity-30 blur-xl sm:blur-2xl group-hover:opacity-60 transition duration-500"></div>
            <div className="relative w-48 h-48 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden border-2 border-gold-400/40 p-2 bg-gray-950 shadow-[0_0_30px_rgba(212,175,55,0.2)] sm:shadow-[0_0_50px_rgba(212,175,55,0.25)]">
              <Image
                src="/logo.jpg"
                alt="Golden Express Emblem"
                fill
                sizes="(max-width: 640px) 192px, (max-width: 768px) 288px, 320px"
                className="object-cover rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Repartidores */}
      <section id="repartidores" className="mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 border-t border-gray-800/50">
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-100 tracking-tight">
            Nuestros Repartidores Activos
          </h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto sm:mx-0">
            Consulta la disponibilidad de los repartidores en tiempo real y chatea con ellos directamente.
          </p>
        </div>

        {/* Componente Grid de Courier */}
        <CourierGrid />
      </section>
    </div>
  );
}
