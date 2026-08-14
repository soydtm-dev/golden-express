"use client";

import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone,
  Car, 
  Shield, 
  ShieldAlert, 
  X, 
  Loader2, 
  Check, 
  AlertCircle,
  Compass,
  Trash2,
  AlertTriangle,
  KeyRound
} from "lucide-react";
import { Courier } from "@/types";
import { inviteCourier, deleteCourier, sendPasswordResetCourier } from "@/app/actions/adminActions";

interface UsersManagementClientProps {
  initialCouriers: Courier[];
}

export default function UsersManagementClient({ initialCouriers }: UsersManagementClientProps) {
  const [couriers, setCouriers] = useState<Courier[]>(initialCouriers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states para invitación
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados para eliminación y restablecimiento de contraseña
  const [courierToDelete, setCourierToDelete] = useState<Courier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Toast notifications state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleOpenModal = () => {
    setEmail("");
    setIsAdmin(false);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await inviteCourier({
        email: email.trim(),
        is_admin: isAdmin
      });

      if (!result.success) {
        setError(result.message);
        showToast(result.message, "error");
        return;
      }

      showToast(result.message, "success");
      setIsModalOpen(false);

    } catch (err: any) {
      console.error("Error al invitar repartidor:", err);
      const isServerActionError = 
        err?.message?.includes("Server Action") || 
        err?.message?.includes("was not found on the server");

      const errorMessage = isServerActionError
        ? "Se ha desplegado una nueva versión en Vercel. Por favor recarga la página (F5) para sincronizar y reintenta."
        : (err.message || "No se pudo completar el proceso de invitación.");

      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Manejador para enviar correo de restablecimiento de contraseña
  const handleSendPasswordReset = async (courier: Courier) => {
    setResettingId(courier.id);
    try {
      const result = await sendPasswordResetCourier(courier.id, courier.name);

      if (!result.success) {
        showToast(result.message, "error");
        return;
      }

      showToast(result.message, "success");
    } catch (err: any) {
      console.error("Error al enviar correo de recuperación:", err);
      showToast(err.message || "No se pudo enviar el correo de recuperación.", "error");
    } finally {
      setResettingId(null);
    }
  };

  // Manejador para confirmar eliminación permanente de repartidor
  const handleConfirmDelete = async () => {
    if (!courierToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteCourier(courierToDelete.id);

      if (!result.success) {
        showToast(result.message, "error");
        return;
      }

      setCouriers(prev => prev.filter(c => c.id !== courierToDelete.id));
      showToast("Repartidor eliminado exitosamente de la base de datos y de Supabase Auth.", "success");
      setCourierToDelete(null);
    } catch (err: any) {
      console.error("Error al eliminar repartidor:", err);
      showToast(err.message || "No se pudo eliminar el repartidor.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredCouriers = couriers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.vehicle_info.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 flex flex-col h-full overflow-hidden">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-2">
            <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gold-500" />
            <span>Gestión de Personal</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
            Administra los roles del sistema, invita nuevos repartidores, gestiona claves y elimina personal.
          </p>
        </div>

        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, tel o vehículo..."
              className="w-full bg-gray-900 border border-gray-805 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          {/* Botón Invitar */}
          <button
            onClick={handleOpenModal}
            className="bg-gold-500 text-gray-900 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs font-bold hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.2)] flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invitar Repartidor</span>
          </button>
        </div>
      </div>

      {/* Contenedor de Tabla */}
      <div className="flex-1 min-h-0 bg-dark-card border border-gray-900 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col">
        {filteredCouriers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-semibold">No se encontraron usuarios</p>
            <p className="text-xs text-gray-600 mt-1">
              Modifica los términos de búsqueda o invita a un nuevo miembro del equipo.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="border-b border-gray-900 bg-gray-950/30 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5">Nombre</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5">Teléfono</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5">Vehículo Asignado</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5">Rol en Sistema</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5 text-center">Estado Conexión</th>
                  <th className="px-4 sm:px-6 py-3.5 sm:py-4.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/60 bg-gray-900/10">
                {filteredCouriers.map((courier) => (
                  <tr 
                    key={courier.id} 
                    className="hover:bg-gray-800/15 transition-colors text-xs text-gray-300"
                  >
                    {/* Nombre */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-tr from-gray-800 to-gray-700 border border-gray-700/30 flex items-center justify-center font-bold text-gray-300 text-xs">
                          {courier.name ? courier.name.split(" ").map(n => n[0]).join("") : "U"}
                        </div>
                        <span className="font-bold text-gray-250">{courier.name || "Sin nombre"}</span>
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Phone className="w-3.5 h-3.5 text-gold-550/70" />
                        <span>{courier.phone || "Sin registro"}</span>
                      </div>
                    </td>

                    {/* Vehículo */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Car className="w-3.5 h-3.5 text-gold-550/70" />
                        <span>{courier.vehicle_info || "Sin especificar"}</span>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 whitespace-nowrap">
                      {courier.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Shield className="w-2.5 h-2.5" />
                          <span>Administrador</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/5 text-emerald-450 border border-emerald-500/10">
                          <Compass className="w-2.5 h-2.5 text-emerald-500" />
                          <span>Repartidor</span>
                        </span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 text-center whitespace-nowrap">
                      {courier.status === "disponible" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Disponible</span>
                        </span>
                      )}
                      {courier.status === "ocupado" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Ocupado</span>
                        </span>
                      )}
                      {courier.status === "desconectado" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-gray-800 text-gray-400 border border-gray-700/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                          <span>Desconectado</span>
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 sm:px-6 py-3.5 sm:py-4.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Recuperar Contraseña */}
                        <button
                          onClick={() => handleSendPasswordReset(courier)}
                          disabled={resettingId === courier.id}
                          title="Enviar correo para recuperar contraseña"
                          className="p-2 rounded-xl text-gold-400 hover:text-gold-300 hover:bg-gold-500/10 border border-gold-500/20 hover:border-gold-500/40 transition-all cursor-pointer inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resettingId === courier.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
                          ) : (
                            <KeyRound className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Recuperar Clave</span>
                        </button>

                        {/* Botón Eliminar Repartidor */}
                        <button
                          onClick={() => setCourierToDelete(courier)}
                          title="Eliminar repartidor"
                          className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog Invitación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-dark-card border border-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6.5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold-400 via-gold-500 to-gold-600" />

            <div className="flex items-center justify-between mb-4 sm:mb-5 pt-1">
              <h3 className="text-xs sm:text-sm font-bold text-gray-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gold-500" />
                <span>Invitar Nuevo Personal</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gold-400 hover:bg-gray-800/40 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 sm:p-3.5 rounded-xl text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Error:</span> {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej. pedro@goldenexpress.com"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-650 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <p className="text-[10px] text-gray-500 pt-1">
                  El usuario invitado completará su nombre, teléfono y vehículo al aceptar la invitación y definir su contraseña.
                </p>
              </div>

              <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="flex items-center h-5">
                  <input
                    id="admin-role"
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-850 text-gold-500 focus:ring-gold-500 bg-gray-950 accent-gold-500 cursor-pointer"
                  />
                </div>
                <div className="text-xs">
                  <label htmlFor="admin-role" className="font-bold text-gray-250 cursor-pointer flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-gold-500" />
                    <span>Conceder Rol de Administrador</span>
                  </label>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Permite al usuario acceder a este panel administrativo para gestionar e invitar personal.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-900/60 mt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 sm:py-2.5 rounded-xl border border-gray-800 text-gray-400 text-xs font-semibold hover:bg-gray-900/60 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gold-500 text-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.15)] flex items-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando invitación...</span>
                    </>
                  ) : (
                    <span>Enviar Invitación</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {courierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-dark-card border border-red-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-red-500 via-red-600 to-red-700" />

            <div className="flex items-start gap-4 mb-4 pt-1">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-100">
                  ¿Eliminar a {courierToDelete.name}?
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Esta acción eliminará de forma permanente el perfil del usuario de la tabla <code className="text-gold-400 bg-gray-900 px-1 py-0.5 rounded">couriers</code> y borrará su cuenta de <strong className="text-gray-200">Supabase Auth</strong>.
                </p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/15 p-3 rounded-xl mb-5 text-[11px] text-red-300">
              ⚠️ Esta operación no se puede deshacer. El repartidor perderá el acceso inmediato a la plataforma.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-900/60">
              <button
                type="button"
                onClick={() => setCourierToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 sm:py-2.5 rounded-xl border border-gray-800 text-gray-400 text-xs font-semibold hover:bg-gray-900/60 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-red-500 text-gray-100 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold hover:bg-red-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(239,68,68,0.2)] flex items-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta Toast Flotante */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)] px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs flex items-center gap-2.5 shadow-lg animate-in slide-in-from-bottom duration-300 ${
          toast.type === "success" 
            ? "bg-emerald-500 text-gray-950 shadow-[0_4px_20px_rgba(16,185,129,0.35)]" 
            : "bg-red-500 text-gray-100 shadow-[0_4px_20px_rgba(239,68,68,0.35)]"
        }`}>
          {toast.type === "success" ? (
            <Check className="w-4 h-4 stroke-3" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
