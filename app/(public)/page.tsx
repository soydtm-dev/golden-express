import React from "react";
import Image from "next/image";
import CourierGrid from "@/components/courier-grid";
import { Shield, Sparkles, Zap, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="relative overflow-hidden pb-16">
      {/* Luces de fondo decorativas (Glow premium) */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-[450px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-10 -z-10 h-[300px] w-[300px] rounded-full bg-gold-700/[0.05] blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
          <div className="max-w-2xl">
            {/* Badge pequeño premium */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-4 py-1.5 text-xs font-bold text-gold-400 border border-gold-500/25 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Servicio de Delivery Local Exclusivo</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl font-black tracking-tight text-gray-100 sm:text-5xl md:text-6xl leading-[1.1]">
              Entregas <span className="text-gold-gradient">rápidas y seguras</span> al instante
            </h1>

            {/* Subtítulo */}
            <p className="mt-6 text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Conecta en tiempo real con nuestra flota selecta de repartidores locales. 
              Llevamos tus paquetes, comida y compras a tu puerta con la máxima confianza y velocidad.
            </p>

            {/* Características destacadas */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-6 text-sm font-semibold text-gray-200">
              <div className="flex items-center gap-2 bg-dark-card/80 border border-gold-500/20 px-3.5 py-2 rounded-xl shadow-sm">
                <Zap className="w-4 h-4 text-gold-400" />
                <span>Velocidad Express</span>
              </div>
              <div className="flex items-center gap-2 bg-dark-card/80 border border-gold-500/20 px-3.5 py-2 rounded-xl shadow-sm">
                <Shield className="w-4 h-4 text-gold-400" />
                <span>Confianza Garantizada</span>
              </div>
              <div className="flex items-center gap-2 bg-dark-card/80 border border-gold-500/20 px-3.5 py-2 rounded-xl shadow-sm">
                <Award className="w-4 h-4 text-gold-400" />
                <span>Servicio VIP</span>
              </div>
            </div>
          </div>

          {/* Logo Showcase Emblem */}
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-700 opacity-30 blur-2xl group-hover:opacity-60 transition duration-500"></div>
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-2 border-gold-400/40 p-2 bg-gray-950 shadow-[0_0_50px_rgba(212,175,55,0.25)]">
              <Image
                src="/logo.jpg"
                alt="Golden Express Emblem"
                fill
                sizes="(max-width: 640px) 256px, 320px"
                className="object-cover rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Repartidores */}
      <section id="repartidores" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 border-t border-gray-800/50">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl font-extrabold text-gray-100 tracking-tight">
            Nuestros Repartidores Activos
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Consulta la disponibilidad de los repartidores en tiempo real y chatea con ellos directamente.
          </p>
        </div>

        {/* Componente Grid de Courier */}
        <CourierGrid />
      </section>
    </div>
  );
}
