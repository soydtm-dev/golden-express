"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail,
  Car, 
  Phone,
  Pencil,
  Save, 
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Loader2, 
  Check, 
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Guardar datos originales para cancelar edición de perfil
  const [originalData, setOriginalData] = useState({
    name: "",
    phone: "",
    vehicleInfo: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para modal de cambio de contraseña
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Estado para errores de validación de campos del perfil
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    vehicleInfo?: string;
  }>({});

  // Notificaciones Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  // 1. Cargar datos del perfil de usuario y de la tabla couriers
  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);
        setEmail(user.email || "");

        const { data, error } = await supabase
          .from("couriers")
          .select("name, vehicle_info, phone, is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const loadedName = data.name || "";
          const loadedPhone = data.phone || "";
          const loadedVehicle = data.vehicle_info || "";

          setName(loadedName);
          setPhone(loadedPhone);
          setVehicleInfo(loadedVehicle);
          setIsAdmin(!!data.is_admin);

          setOriginalData({
            name: loadedName,
            phone: loadedPhone,
            vehicleInfo: loadedVehicle,
          });
        }
      } catch (err: any) {
        console.error("Error al cargar perfil:", err);
        showToast("Error al obtener los datos del perfil.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // 2. Validaciones estrictas de campos de entrada del perfil
  const validateFields = (): boolean => {
    const newErrors: { name?: string; phone?: string; vehicleInfo?: string } = {};

    // Validar Nombre Completo
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = "El nombre completo es obligatorio.";
    } else if (trimmedName.length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres.";
    } else if (trimmedName.length > 70) {
      newErrors.name = "El nombre no puede exceder los 70 caracteres.";
    } else if (!/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s.\-]+$/.test(trimmedName)) {
      newErrors.name = "El nombre solo puede contener letras, espacios, puntos y guiones.";
    }

    // Validar Teléfono
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      newErrors.phone = "El número de teléfono es obligatorio.";
    } else if (!/^\+?[0-9\s\-\(\)]{8,20}$/.test(trimmedPhone)) {
      newErrors.phone = "Formato de teléfono inválido (ej. +52 55 1234 5678 o 5512345678).";
    }

    // Validar Detalles del Vehículo
    const trimmedVehicle = vehicleInfo.trim();
    if (!trimmedVehicle) {
      newErrors.vehicleInfo = "La información del vehículo es obligatoria.";
    } else if (trimmedVehicle.length < 3) {
      newErrors.vehicleInfo = "La información del vehículo debe tener al menos 3 caracteres.";
    } else if (trimmedVehicle.length > 100) {
      newErrors.vehicleInfo = "La información no puede exceder los 100 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartEditing = () => {
    setErrors({});
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setName(originalData.name);
    setPhone(originalData.phone);
    setVehicleInfo(originalData.vehicleInfo);
    setErrors({});
    setIsEditing(false);
  };

  // 3. Guardar / Actualizar datos del perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!validateFields()) {
      showToast("Por favor, corrige los errores en el formulario antes de guardar.", "error");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("couriers")
        .update({
          name: name.trim(),
          vehicle_info: vehicleInfo.trim(),
          phone: phone.trim()
        })
        .eq("id", userId);

      if (error) throw error;

      setOriginalData({
        name: name.trim(),
        phone: phone.trim(),
        vehicleInfo: vehicleInfo.trim(),
      });

      setIsEditing(false);
      showToast("¡Perfil actualizado con éxito!", "success");
    } catch (err: any) {
      console.error("Error al actualizar perfil:", err);
      showToast(err.message || "No se pudieron guardar los cambios del perfil.", "error");
    } finally {
      setSaving(false);
    }
  };

  // 4. Manejador para Cambio de Contraseña requiriendo Contraseña Actual
  const handleOpenPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Por favor, ingresa tu contraseña actual.");
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError("La nueva contraseña no puede estar vacía.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("La nueva contraseña debe ser diferente a la contraseña actual.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las nuevas contraseñas ingresadas no coinciden.");
      return;
    }

    setUpdatingPassword(true);

    try {
      const supabase = createClient();

      // Paso 1: Validar que la contraseña actual sea correcta reautenticando el usuario
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError("La contraseña actual es incorrecta. Por favor verifícala e inténtalo de nuevo.");
        setUpdatingPassword(false);
        return;
      }

      // Paso 2: Actualizar a la nueva contraseña en Supabase Auth
      const { error: authUpdateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authUpdateError) {
        throw authUpdateError;
      }

      showToast("¡Contraseña actualizada con éxito!", "success");
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error al actualizar contraseña:", err);
      setPasswordError(err.message || "Ocurrió un error al intentar cambiar la contraseña.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto h-full overflow-y-auto scrollbar-thin">
      {/* Encabezado */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-2">
          <User className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gold-500" />
          <span>Mi Perfil</span>
        </h2>
        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
          Consulta y gestiona tu información personal, detalles del vehículo y seguridad de la cuenta.
        </p>
      </div>

      {loading ? (
        /* Estado de Carga */
        <div className="bg-gray-800/40 border border-gray-700/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-center justify-center py-16 sm:py-20 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <span className="text-xs text-gray-400 font-medium">Cargando datos del perfil...</span>
        </div>
      ) : (
        /* Contenedor Principal del Perfil */
        <div className="bg-gray-800/40 border border-gray-700/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-md shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Línea dorada decorativa superior */}
          <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold-400 via-gold-500 to-gold-600" />

          {/* Tarjeta con Avatar e Información Resumida */}
          <div className="flex items-center gap-4 p-4 bg-gray-900/60 border border-gray-800/80 rounded-2xl mb-6">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-gold-600 via-gold-500 to-gold-400 p-0.5 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center font-black text-gold-400 text-lg">
                {name ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "GE"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-100 truncate">{name || "Sin nombre"}</h3>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Administrador</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span>Repartidor</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">{email}</p>
            </div>
          </div>

          {!isEditing ? (
            /* =========================================================================
             * VISTA DE SOLO LECTURA (Campos no editables por defecto)
             * ========================================================================= */
            <div className="space-y-4">
              {/* Campo: Correo Electrónico (No editable) */}
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-800/60 flex items-center justify-center text-gold-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Correo Electrónico
                    </span>
                    <span className="text-xs text-gray-200 font-semibold">{email || "Sin correo"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/80 border border-gray-700/50 rounded-lg text-[10px] font-medium text-gray-400">
                  <Lock className="w-3 h-3 text-gold-500" />
                  <span>Fijo</span>
                </div>
              </div>

              {/* Campo: Nombre Completo */}
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800/60 flex items-center justify-center text-gold-500">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Nombre Completo
                  </span>
                  <span className="text-xs text-gray-200 font-semibold">{name || "Sin nombre registrado"}</span>
                </div>
              </div>

              {/* Campo: Teléfono */}
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800/60 flex items-center justify-center text-gold-500">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Número de Teléfono
                  </span>
                  <span className="text-xs text-gray-200 font-semibold">{phone || "Sin teléfono registrado"}</span>
                </div>
              </div>

              {/* Campo: Vehículo Asignado */}
              <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800/60 flex items-center justify-center text-gold-500">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Información del Vehículo
                  </span>
                  <span className="text-xs text-gray-200 font-semibold">{vehicleInfo || "Sin vehículo especificado"}</span>
                </div>
              </div>

              {/* Botonera de Acciones en Vista de Lectura */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-800/60 mt-6">
                <button
                  type="button"
                  onClick={handleOpenPasswordModal}
                  className="px-4 py-2.5 rounded-xl border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Cambiar Contraseña</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="bg-gold-500 text-gray-900 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-gray-900" />
                  <span>Modificar Perfil</span>
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================================
             * FORMULARIO DE EDICIÓN DE PERFIL
             * ========================================================================= */
            <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-5">
              {/* Campo Correo (Bloqueado/No editable) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Correo Electrónico</span>
                  <span className="text-[9px] text-gold-500 font-normal">(No modificable)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-400 opacity-70 cursor-not-allowed select-none"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gold-500 pointer-events-none">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 pl-0.5">
                  El correo electrónico es el identificador principal de tu cuenta y no puede modificarse.
                </p>
              </div>

              {/* Campo Nombre Completo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Ej. Carlos Mendoza"
                    className={`w-full bg-gray-900 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-150 placeholder-gray-600 focus:outline-none transition-all ${
                      errors.name 
                        ? "border-red-500/80 focus:border-red-500" 
                        : "border-gray-800 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/10"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Campo Teléfono */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Número de Teléfono <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="Ej. +52 55 1234 5678"
                    className={`w-full bg-gray-900 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-150 placeholder-gray-600 focus:outline-none transition-all ${
                      errors.phone 
                        ? "border-red-500/80 focus:border-red-500" 
                        : "border-gray-800 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/10"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Campo Vehículo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Información del Vehículo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                    <Car className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={vehicleInfo}
                    onChange={(e) => {
                      setVehicleInfo(e.target.value);
                      if (errors.vehicleInfo) setErrors(prev => ({ ...prev, vehicleInfo: undefined }));
                    }}
                    placeholder="Ej. Motocicleta Honda - Placa 1234"
                    className={`w-full bg-gray-900 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-150 placeholder-gray-600 focus:outline-none transition-all ${
                      errors.vehicleInfo 
                        ? "border-red-500/80 focus:border-red-500" 
                        : "border-gray-800 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/10"
                    }`}
                  />
                </div>
                {errors.vehicleInfo ? (
                  <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.vehicleInfo}</span>
                  </p>
                ) : (
                  <p className="text-[9px] text-gray-500 pl-0.5">
                    Consejo: Especifica tipo de vehículo y placas para la asignación de entregas.
                  </p>
                )}
              </div>

              {/* Botonera de la Edición */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800/60 mt-6">
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={saving}
                  className="px-4.5 py-2.5 rounded-xl border border-gray-800 text-gray-400 text-xs font-semibold hover:bg-gray-900/60 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gold-500 text-gray-900 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.2)] disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-gray-900" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Modal Dialog Form - Cambiar Contraseña */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-dark-card border border-gold-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6.5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Línea superior dorada decorativa */}
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold-400 via-gold-500 to-gold-600" />

            <div className="flex items-center justify-between mb-4 sm:mb-5 pt-1">
              <h3 className="text-xs sm:text-sm font-bold text-gray-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-gold-500" />
                <span>Cambiar Contraseña</span>
              </h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-500 hover:text-gold-400 hover:bg-gray-800/40 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 sm:p-3.5 rounded-xl text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Error:</span> {passwordError}
                </div>
              </div>
            )}

            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4">
              {/* Contraseña Actual */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Contraseña Actual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Confirmar Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botonera del Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-900/60 mt-5">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 sm:py-2.5 rounded-xl border border-gray-800 text-gray-400 text-xs font-semibold hover:bg-gray-900/60 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-gold-500 text-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.15)] flex items-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                >
                  {updatingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Actualizar Contraseña</span>
                  )}
                </button>
              </div>
            </form>
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
