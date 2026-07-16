"use client";

import React, { useState, useEffect } from "react";
import CourierCard from "./courier-card";
import { Courier } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { Shield } from "lucide-react";

export default function CourierGrid() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar el cliente de Supabase para el navegador
    const supabase = createClient();

    /**
     * Función asíncrona para obtener el listado inicial de repartidores
     * mediante un SELECT simple a la tabla 'couriers'
     */
    const fetchCouriers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("couriers")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          throw error;
        }
        setCouriers(data || []);
      } catch (err: any) {
        console.error("Error al obtener los repartidores:", err);
        setError(err.message || "No se pudieron obtener los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchCouriers();

    /**
     * Configuración del canal de tiempo real (Supabase Realtime)
     * 1. Definimos un identificador de canal único 'realtime-couriers'
     * 2. Escuchamos cambios de tipo 'postgres_changes'
     * 3. Filtramos específicamente para el evento 'UPDATE'
     * 4. Indicamos el esquema ('public') y la tabla ('couriers')
     * 5. Al dispararse, actualizamos inmediatamente el estado local de React
     */
    const channel = supabase
      .channel("realtime-couriers")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "couriers",
        },
        (payload) => {
          console.log("Cambio en tiempo real detectado:", payload);
          const updatedCourier = payload.new as Courier;

          // Reemplaza el repartidor modificado en el estado de React para actualizar la UI al instante
          setCouriers((prevCouriers) =>
            prevCouriers.map((c) => (c.id === updatedCourier.id ? updatedCourier : c))
          );
        }
      )
      .subscribe((status) => {
        console.log(`Estado de suscripción realtime: ${status}`);
      });

    // Limpieza de la suscripción al desmontar el componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 1. Estado de carga inicial (Skeleton Screens dorados y elegantes)
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative bg-dark-card/60 border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between h-56 overflow-hidden animate-pulse"
          >
            {/* Destello dorado sutil */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500/20 via-gold-500/40 to-gold-500/20" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700/50" />
                <div className="w-24 h-6 rounded-full bg-gray-800/80 border border-gray-700/30" />
              </div>
              <div className="h-5 w-3/4 rounded bg-gray-800/80 mb-3" />
              <div className="h-4 w-1/2 rounded bg-gray-800/60" />
            </div>
            <div className="w-full h-11 rounded-xl bg-gray-800/40 mt-4 border border-gray-700/20" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Estado de error (En caso de fallar la conexión con Supabase)
  if (error) {
    return (
      <div className="text-center py-12 px-4 max-w-md mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-200">Error de conexión</h3>
        <p className="text-sm text-gray-400 mt-2">{error}</p>
        <p className="text-xs text-gray-500 mt-1">Verifica tus variables de entorno en el archivo .env.local</p>
      </div>
    );
  }

  // 3. Estado vacío (Sin repartidores registrados)
  if (couriers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-dark-card/40 border border-gray-800/50 rounded-3xl max-w-2xl mx-auto backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="w-16 h-16 rounded-full bg-gold-500/5 flex items-center justify-center border border-gold-500/10 mb-4 animate-pulse">
          <Shield className="w-8 h-8 text-gold-500/40" />
        </div>
        <h3 className="text-xl font-bold text-gray-200">No hay repartidores disponibles</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-md leading-relaxed">
          Actualmente no hay repartidores registrados en nuestra base de datos.
        </p>
      </div>
    );
  }

  // 4. Renderizado normal de la lista de repartidores
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {couriers.map((courier) => (
        <CourierCard key={courier.id} courier={courier} />
      ))}
    </div>
  );
}
