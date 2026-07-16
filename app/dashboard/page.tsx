"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Send, 
  Paperclip, 
  CheckCheck, 
  Navigation, 
  Clock, 
  MessageSquare,
  Phone,
  Check,
  User,
  AlertCircle,
  Loader2,
  ClipboardList,
  X
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ChatSession, Message } from "@/types";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Estados para el Modal de Registro de Pedidos (Fase 5)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderOrigin, setOrderOrigin] = useState("");
  const [orderDestination, setOrderDestination] = useState("");
  const [orderDescription, setOrderDescription] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Estado para notificaciones Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  const openOrderModal = () => {
    if (!selectedChat) return;
    setOrderDestination(getMockAddress(selectedChat.customer_name));
    setOrderOrigin("");
    setOrderDescription("");
    setOrderPrice("");
    setOrderError(null);
    setIsOrderModalOpen(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedChatId || !orderOrigin.trim() || !orderDestination.trim() || !orderPrice) {
      setOrderError("Por favor, completa todos los campos requeridos.");
      return;
    }

    setSubmittingOrder(true);
    setOrderError(null);

    try {
      const supabase = createClient();

      // 1. Insertar el pedido en la tabla orders
      const { error: insertError } = await supabase
        .from("orders")
        .insert({
          courier_id: userId,
          chat_session_id: selectedChatId,
          origin: orderOrigin.trim(),
          destination: orderDestination.trim(),
          description: orderDescription.trim() || null,
          price: parseFloat(orderPrice.toString())
        });

      if (insertError) throw insertError;

      // 2. Actualizar el estado de la sesión de chat a cerrado
      const { error: updateError } = await supabase
        .from("chat_sessions")
        .update({ status: "cerrado" })
        .eq("id", selectedChatId);

      if (updateError) throw updateError;

      // Notificación de éxito
      setToastMessage("Pedido registrado con éxito y chat finalizado.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);

      // Cerrar modal y limpiar formulario
      setIsOrderModalOpen(false);
      setOrderOrigin("");
      setOrderDestination("");
      setOrderDescription("");
      setOrderPrice("");

      // Remover el chat de la lista activa del repartidor
      setChats((prev) => prev.filter((c) => c.id !== selectedChatId));
      setSelectedChatId(null);
    } catch (err: any) {
      console.error("Error al registrar el pedido:", err);
      setOrderError(err.message || "No se pudo registrar el pedido. Verifica tu conexión.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // 1. Obtener el ID del usuario autenticado
  useEffect(() => {
    const supabase = createClient();
    const getAuthUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getAuthUser();
  }, []);

  // 2. Cargar sesiones de chat activas y suscribirse en tiempo real
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const fetchActiveSessions = async () => {
      try {
        setLoadingChats(true);
        const { data, error } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("courier_id", userId)
          .eq("status", "abierto")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setChats(data || []);
      } catch (err) {
        console.error("Error al cargar las sesiones de chat:", err);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchActiveSessions();

    /**
     * Suscripción Realtime a eventos INSERT y UPDATE en chat_sessions
     * Filtrado por el ID del repartidor logueado.
     */
    const sessionChannel = supabase
      .channel(`courier-sessions-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
          filter: `courier_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Cambio en sesión de chat detectado en dashboard:", payload);
          if (payload.eventType === "INSERT") {
            const newSession = payload.new as ChatSession;
            if (newSession.status === "abierto") {
              setChats((prev) => {
                if (prev.some((s) => s.id === newSession.id)) return prev;
                return [newSession, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedSession = payload.new as ChatSession;
            if (updatedSession.status === "cerrado") {
              // Quitar de la lista activa
              setChats((prev) => prev.filter((s) => s.id !== updatedSession.id));
              // Si es el chat activo, deseleccionarlo
              setSelectedChatId((currentId) => currentId === updatedSession.id ? null : currentId);
            } else {
              setChats((prev) =>
                prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
              );
            }
          }
        }
      )
      .subscribe();

    // Limpiar canal al desmontar
    return () => {
      console.log("Limpiando canal de sesiones del repartidor");
      supabase.removeChannel(sessionChannel);
    };
  }, [userId]);

  // 3. Cargar historial del chat activo y suscribirse a sus nuevos mensajes en tiempo real
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const supabase = createClient();

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_session_id", selectedChatId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error("Error al cargar mensajes del chat:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    /**
     * Suscripción Realtime a eventos INSERT en messages para la sesión activa.
     */
    const messagesChannel = supabase
      .channel(`active-messages-${selectedChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_session_id=eq.${selectedChatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Evitar duplicar si se envió optimistamente
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    // Limpiar canal de mensajes al cambiar de chat o desmontar
    return () => {
      console.log("Limpiando canal de mensajes de la sesión", selectedChatId);
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedChatId]);

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Enviar mensaje del repartidor
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;

    const msgText = inputText.trim();
    setInputText("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_session_id: selectedChatId,
          sender: "repartidor",
          content: msgText
        });

      if (error) throw error;
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      setInputText(msgText);
    }
  };

  // Finalizar chat activo (UPDATE chat_sessions SET status = 'cerrado')
  const handleFinalizeChat = async () => {
    if (!selectedChatId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("chat_sessions")
        .update({ status: "cerrado" })
        .eq("id", selectedChatId);

      if (error) throw error;
      
      // Remover localmente también
      setChats((prev) => prev.filter(c => c.id !== selectedChatId));
      setSelectedChatId(null);
    } catch (err) {
      console.error("Error al finalizar el chat:", err);
    }
  };

  // Dirección mockeada de acuerdo a referencias de calles locales
  const getMockAddress = (clientName: string) => {
    const name = clientName.toLowerCase();
    if (name.includes("carlos")) {
      return "Avenida Bolívar #142, Centro";
    }
    if (name.includes("valeria")) {
      return "Calle Los Pinos #55, Barrio Pompeya";
    }
    if (name.includes("mateo")) {
      return "Av. Las Américas #88, Barrio Pompeya";
    }
    return "Zona Centro, Entrega Express";
  };

  const filteredChats = chats.filter(chat => 
    chat.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* 1. Columna Izquierda - Lista de Chats Activos */}
      <section className="w-80 sm:w-96 border-r border-gray-900 flex flex-col bg-gray-950/40 shrink-0 h-full">
        {/* Buscador */}
        <div className="p-4 border-b border-gray-900/60 shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-gray-900 border border-gray-805 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {loadingChats ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
              <span className="text-xs text-gray-500">Cargando entregas...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-xs text-gray-400 font-medium">No tienes chats de entrega activos</p>
              <p className="text-[10px] text-gray-600 mt-1">Los nuevos pedidos de clientes aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3 border transition-all duration-200 cursor-pointer ${
                  selectedChatId === chat.id
                    ? "bg-gold-500/10 border-gold-500/20 shadow-md"
                    : "bg-dark-card border-gray-900 hover:border-gray-805"
                }`}
              >
                <div className="shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center font-bold text-gray-900 text-sm">
                    {chat.customer_name.split(" ").map(n => n[0]).join("")}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs font-bold text-gray-200 truncate pr-1">
                      {chat.customer_name}
                    </h4>
                    <span className="text-[10px] text-gray-555 shrink-0 font-medium">
                      {chat.created_at ? new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-gold-500/60 shrink-0" />
                    <span className="truncate">{getMockAddress(chat.customer_name)}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* 2. Columna Derecha - Conversación Activa */}
      <section className="flex-1 flex flex-col bg-gray-900/10 h-full overflow-hidden">
        {selectedChat ? (
          <>
            {/* Header Chat */}
            <div className="px-6 py-4.5 border-b border-gray-900 bg-dark-card/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center font-bold text-gray-900 text-sm">
                  {selectedChat.customer_name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-100">{selectedChat.customer_name}</h3>
                    {/* Botón Registrar Pedido (Fase 5) */}
                    <button
                      onClick={openOrderModal}
                      className="ml-2 bg-gold-500 text-gray-900 font-bold hover:bg-gold-600 px-3.5 py-1.5 rounded-xl text-[10px] flex items-center gap-1 cursor-pointer shadow-[0_2px_8px_rgba(245,158,11,0.15)] active:scale-95 transition-all shrink-0"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Registrar Pedido</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <MapPin className="w-3 h-3 text-gold-500 shrink-0" />
                      <span>{getMockAddress(selectedChat.customer_name)}</span>
                    </span>
                    {selectedChat.customer_phone && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                        <Phone className="w-3 h-3 text-gold-500 shrink-0" />
                        <span>{selectedChat.customer_phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón Finalizar Chat */}
              <button
                onClick={handleFinalizeChat}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all text-xs font-bold shrink-0 cursor-pointer shadow-md"
              >
                Finalizar Chat
              </button>
            </div>

            {/* Mensajes del Historial */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-950/20 scrollbar-thin">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-gray-500">Conexión exitosa. Esperando mensajes del cliente...</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[70%] ${
                      msg.sender === "repartidor" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-lg ${
                        msg.sender === "repartidor"
                          ? "bg-gold-500 text-gray-900 font-medium rounded-tr-none"
                          : "bg-dark-card text-gray-200 border border-gray-800/85 rounded-tl-none"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 px-1.5">
                      <span className="text-[9px] text-gray-500">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ahora"}
                      </span>
                      {msg.sender === "repartidor" && <CheckCheck className="w-3.5 h-3.5 text-gold-600" />}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input responder */}
            <form 
              onSubmit={handleSendMessage} 
              className="p-4 bg-dark-card/30 border-t border-gray-900 flex items-center gap-2.5 shrink-0"
            >
              <button
                type="button"
                className="text-gray-400 hover:text-gold-400 p-2 rounded-xl hover:bg-gray-900/40 transition-colors shrink-0"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>
              
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Escribe un mensaje para ${selectedChat.customer_name}...`}
                className="flex-1 bg-gray-900 border border-gray-805 rounded-xl px-4 py-3 text-xs text-gray-150 placeholder-gray-550 focus:outline-none focus:border-gold-500/50"
              />
              
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-gold-500 text-gray-900 p-3 rounded-xl hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4 font-bold" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gold-500/5 flex items-center justify-center border border-gold-500/10">
              <MessageSquare className="w-8 h-8 text-gold-500/40" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-200">Selecciona una entrega</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                Escoge uno de tus clientes de la columna izquierda para iniciar la conversación y coordinar la entrega.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Modal de Registro de Pedido (Fase 5) */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-dark-card border border-gray-800 rounded-3xl p-6.5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Línea decorativa superior */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />
            
            <div className="flex items-center justify-between mb-5 pt-1">
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gold-500" />
                <span>Registrar Nuevo Pedido</span>
              </h3>
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="text-gray-500 hover:text-gold-400 hover:bg-gray-800/40 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {orderError && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Error:</span> {orderError}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Punto de Origen (Recogida) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderOrigin}
                  onChange={(e) => setOrderOrigin(e.target.value)}
                  placeholder="Ej. Plaza Principal General José Ballivián o Avenida 6 de Agosto"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-100 placeholder-gray-650 focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Punto de Destino (Entrega) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderDestination}
                  onChange={(e) => setOrderDestination(e.target.value)}
                  placeholder="Ej. Calle Los Pinos #55, Barrio Pompeya"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-100 placeholder-gray-650 focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Notas / Descripción
                  </label>
                  <textarea
                    value={orderDescription}
                    onChange={(e) => setOrderDescription(e.target.value)}
                    placeholder="Ej. Llevar cambio de 100Bs, paquete frágil"
                    rows={2}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-100 placeholder-gray-650 focus:outline-none focus:border-gold-500/50 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Precio (Bs.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    placeholder="25"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-100 placeholder-gray-650 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-900/60 mt-5">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-800 text-gray-400 text-xs font-semibold hover:bg-gray-900/60 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="bg-gold-500 text-gray-900 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.15)] flex items-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Registrar Pedido</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notificación Toast (Fase 5) */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-gray-950 px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.35)] animate-in slide-in-from-bottom duration-300">
          <Check className="w-4 h-4 text-gray-950 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
