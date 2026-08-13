"use client";

import React, { useState, useEffect } from "react";
import { 
  History as HistoryIcon, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Loader2,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface OrderWithCourier {
  id: string;
  courier_id: string;
  chat_session_id?: string;
  origin: string;
  destination: string;
  description?: string;
  price: number;
  created_at: string;
  couriers: {
    name: string;
  } | null;
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<OrderWithCourier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // SELECT a la tabla orders con JOIN a la tabla couriers para obtener el nombre
        const { data, error: fetchError } = await supabase
          .from("orders")
          .select("*, couriers(name)")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        // Conversión segura de tipos
        setOrders((data as any) || []);
      } catch (err: any) {
        console.error("Error al obtener el historial de pedidos:", err);
        setError(err.message || "No se pudieron obtener los datos del historial");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filtrar pedidos locales por dirección de destino o nombre del repartidor
  const filteredOrders = orders.filter((order) => {
    const search = searchQuery.toLowerCase();
    const destMatches = order.destination.toLowerCase().includes(search);
    const originMatches = order.origin.toLowerCase().includes(search);
    const courierMatches = order.couriers?.name?.toLowerCase().includes(search) || false;
    return destMatches || originMatches || courierMatches;
  });

  // Formateador de fecha legible (ej. "03 Jul 2026, 11:42 AM")
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
        .format(date)
        .replace(".", ""); // Quita puntos abreviados de meses si los hay
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto h-full flex flex-col overflow-hidden">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-2">
            <HistoryIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gold-500" />
            <span>Historial de Envíos</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
            Registro de todas las entregas coordinadas y pedidos guardados en el sistema.
          </p>
        </div>

        {/* Buscador interactivo */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por calle, cliente o repartidor..."
            className="w-full bg-gray-900 border border-gray-805 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50"
          />
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="flex-1 min-h-0 bg-dark-card border border-gray-900 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col">
        {loading ? (
          /* Esqueleto de Carga */
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            <span className="text-xs text-gray-400 font-medium">Cargando historial de pedidos...</span>
          </div>
        ) : error ? (
          /* Alerta de Error */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/5 flex items-center justify-center border border-red-500/10 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-200">Error al cargar datos</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-70">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Estado Vacío (Empty State) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gold-500/5 flex items-center justify-center border border-gold-500/10 mb-4 animate-pulse">
              <FileSpreadsheet className="w-6 h-6 text-gold-500/40" />
            </div>
            <h4 className="text-sm font-semibold text-gray-200">Aún no hay pedidos registrados</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-70">
              Los pedidos registrados por los repartidores aparecerán listados aquí en orden cronológico.
            </p>
          </div>
        ) : (
          /* Data Table con Scroll */
          <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-162.5">
              <thead>
                <tr className="border-b border-gray-900 bg-gray-950/30 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5">Fecha y Hora</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5">Repartidor</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5">Origen</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5">Destino</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5 text-right">Precio</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/60 bg-gray-900/10">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-800/15 transition-colors group text-xs text-gray-300"
                  >
                    {/* Fecha y Hora */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-2 font-medium text-gray-250">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{formatDateTime(order.created_at)}</span>
                      </div>
                    </td>

                    {/* Repartidor */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 whitespace-nowrap">
                      <span className="font-bold text-gray-200">
                        {order.couriers?.name || "Sin repartidor"}
                      </span>
                    </td>

                    {/* Origen */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 max-w-40 sm:max-w-50 truncate" title={order.origin}>
                      <span className="text-gray-400">{order.origin}</span>
                    </td>

                    {/* Destino */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 max-w-40 sm:max-w-50 truncate" title={order.destination}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gold-550 shrink-0" />
                        <span className="text-gray-400">{order.destination}</span>
                      </div>
                    </td>

                    {/* Precio */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 text-right whitespace-nowrap font-bold text-gold-400">
                      <span>Bs. {order.price.toFixed(2)}</span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Coordinado</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
