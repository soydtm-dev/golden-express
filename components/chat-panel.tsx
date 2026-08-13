"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Paperclip, Loader2, User, Phone, CheckCheck } from "lucide-react";
import { Courier, Message, ChatSession } from "@/types";
import { createClient } from "@/utils/supabase/client";

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  
  // Estados para el inicio de sesión del chat
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"abierto" | "cerrado" | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escuchar el evento personalizado para iniciar un chat
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<{ courier: Courier }>;
      if (customEvent.detail && customEvent.detail.courier) {
        setSelectedCourier(customEvent.detail.courier);
        setIsOpen(true);
      }
    };
    window.addEventListener("open-chat", handleOpenChat);
    return () => {
      window.removeEventListener("open-chat", handleOpenChat);
    };
  }, []);

  // Manejar el cambio de repartidor: Verificar sesión local o reiniciar estados
  useEffect(() => {
    if (!selectedCourier) {
      setSessionId(null);
      setSessionStatus(null);
      setMessages([]);
      return;
    }

    const supabase = createClient();
    const storedSessionId = localStorage.getItem(`golden_express_session_${selectedCourier.id}`);

    const verifyStoredSession = async (sessId: string) => {
      try {
        setLoading(true);
        // Verificar si la sesión guardada en localStorage sigue existiendo en Supabase (usando maybeSingle)
        const { data: session, error } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("id", sessId)
          .maybeSingle();

        if (error || !session) {
          localStorage.removeItem(`golden_express_session_${selectedCourier.id}`);
          setSessionId(null);
          setSessionStatus(null);
          setMessages([]);
          return;
        }

        setSessionId(session.id);
        setSessionStatus(session.status);

        // Si la sesión sigue abierta, cargar su historial de mensajes
        if (session.status === "abierto") {
          const { data: msgs, error: msgsError } = await supabase
            .from("messages")
            .select("*")
            .eq("chat_session_id", session.id)
            .order("created_at", { ascending: true });

          if (!msgsError) {
            setMessages(msgs || []);
          }
        }
      } catch (err) {
        console.error("Error al verificar la sesión de chat almacenada:", err);
      } finally {
        setLoading(false);
      }
    };

    if (storedSessionId) {
      verifyStoredSession(storedSessionId);
    } else {
      setSessionId(null);
      setSessionStatus(null);
      setMessages([]);
    }
  }, [selectedCourier]);

  // Suscribirse en Tiempo Real (Realtime) a los cambios de la sesión y nuevos mensajes
  useEffect(() => {
    if (!sessionId || sessionStatus !== "abierto") return;

    const supabase = createClient();

    /**
     * 1. Canal de Realtime para Mensajes:
     * Escucha eventos 'INSERT' en la tabla 'messages' filtrados por el ID de la sesión actual.
     */
    const messagesChannel = supabase
      .channel(`client-messages-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Evitar duplicar mensajes que fueron enviados optimistamente
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    /**
     * 2. Canal de Realtime para la Sesión:
     * Escucha eventos 'UPDATE' en la tabla 'chat_sessions' para detectar si el repartidor finaliza el chat.
     */
    const sessionChannel = supabase
      .channel(`client-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updatedSession = payload.new as ChatSession;
          setSessionStatus(updatedSession.status);
        }
      )
      .subscribe();

    // Limpieza de las suscripciones al desmontar el componente para evitar fugas de memoria
    return () => {
      console.log("Limpiando suscripciones Realtime en el cliente");
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, sessionStatus]);

  // Scroll automático hacia el último mensaje recibido o enviado
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Crear una sesión de chat inicial en la base de datos
  const handleStartChatSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourier || !clientName.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();

      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({
          courier_id: selectedCourier.id,
          customer_name: clientName.trim(),
          customer_phone: clientPhone.trim() || null,
          status: "abierto"
        })
        .select()
        .single();

      if (error) throw error;

      if (newSession) {
        setSessionId(newSession.id);
        setSessionStatus(newSession.status);
        localStorage.setItem(`golden_express_session_${selectedCourier.id}`, newSession.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error al crear la sesión de chat:", err);
    } finally {
      setLoading(false);
    }
  };

  // Enviar un mensaje de chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId || sessionStatus !== "abierto") return;

    const messageText = inputText.trim();
    setInputText(""); // Limpieza optimista del campo de texto

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("messages")
        .insert({
          chat_session_id: sessionId,
          sender: "cliente",
          content: messageText
        });

      if (error) throw error;
    } catch (err) {
      console.error("Error al enviar el mensaje:", err);
      setInputText(messageText); // Restaurar texto si falla el insert
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]">
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="mb-3 sm:mb-4 w-[calc(100vw-2rem)] sm:w-100 max-w-100 h-[75vh] max-h-130 sm:h-125 rounded-2xl bg-dark-card border border-gold-500/20 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 backdrop-blur-lg">
          {/* Header */}
          <div className="bg-gray-800/80 px-4 py-3 flex items-center justify-between border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              {selectedCourier ? (
                <>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-linear-to-tr from-gold-600 to-gold-400 flex items-center justify-center font-bold text-gray-900 text-sm">
                      {selectedCourier.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-card ${
                      selectedCourier.status === "disponible" ? "bg-emerald-500 animate-pulse" : selectedCourier.status === "ocupado" ? "bg-orange-500" : "bg-gray-500"
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-100">{selectedCourier.name}</h3>
                    <p className="text-xs text-gray-400">
                      {selectedCourier.status === "disponible" ? "Disponible" : selectedCourier.status === "ocupado" ? "Ocupado" : "Desconectado"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/30">
                    <MessageSquare className="w-5 h-5 text-gold-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-100">Soporte Golden Express</h3>
                    <p className="text-xs text-gray-400">Canal de ayuda general</p>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gold-400 transition-colors p-1 rounded-lg hover:bg-gray-700/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo del Chat / Modal de Login del chat */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-900/30 flex flex-col justify-between">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
                <p className="text-xs text-gray-400 mt-2">Cargando...</p>
              </div>
            ) : !selectedCourier ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gold-500/5 flex items-center justify-center border border-gold-500/10">
                  <MessageSquare className="w-8 h-8 text-gold-500/40" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">No hay conversación activa</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-50">
                    Selecciona un repartidor del grid para iniciar un chat directo con él.
                  </p>
                </div>
              </div>
            ) : !sessionId ? (
              /* Modal/Formulario de datos de contacto */
              <form onSubmit={handleStartChatSession} className="flex-1 flex flex-col justify-center p-4 space-y-4">
                <div className="text-center mb-2">
                  <h4 className="text-sm font-bold text-gray-200">Datos de Contacto</h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Introduce tu nombre para que {selectedCourier.name} sepa con quién habla.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full bg-gray-950 border border-gray-805 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-250 focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Teléfono (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+54 9 11 1234-5678"
                      className="w-full bg-gray-950 border border-gray-805 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-250 focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-500 text-gray-900 font-bold py-2.5 rounded-xl text-xs hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.15)] mt-2 cursor-pointer animate-in fade-in-50 duration-200"
                >
                  Iniciar Chat
                </button>
              </form>
            ) : (
              /* Historial de mensajes en tiempo real */
              <div className="flex-1 flex flex-col justify-between h-full">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 scrollbar-thin">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <p className="text-[11px] text-gray-500">¡Conexión establecida! Di hola para iniciar.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${
                          msg.sender === "cliente" ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === "cliente"
                              ? "bg-gray-800 text-gray-150 rounded-tr-none border border-gray-700/40 shadow-md"
                              : "bg-gold-500/5 text-gray-200 border border-gold-500/20 rounded-tl-none"
                          }`}
                        >
                          <p className="wrap-break-word">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[9px] text-gray-500">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ahora"}
                          </span>
                          {msg.sender === "cliente" && <CheckCheck className="w-3 h-3 text-gold-600" />}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Banner de Chat Finalizado por el Repartidor */}
                {sessionStatus === "cerrado" && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-center py-2.5 px-4 rounded-xl text-xs font-semibold animate-in fade-in duration-300">
                    El repartidor ha finalizado la conversación.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Formulario de Envío de Mensaje */}
          {sessionId && sessionStatus === "abierto" && !loading && (
            <form onSubmit={handleSendMessage} className="p-3 bg-gray-800/40 border-t border-gray-700/50 flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="text-gray-400 hover:text-gold-400 p-1.5 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-gray-900 border border-gray-700/60 rounded-xl px-3 py-2 text-xs text-gray-150 placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-gold-500 text-gray-900 p-2 rounded-xl hover:bg-gold-600 transition-all disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4 font-bold" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Botón Flotante (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gold-500 text-gray-900 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_25px_rgba(245,158,11,0.8)] transition-all hover:scale-110 active:scale-95 duration-300 relative group cursor-pointer"
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-12" />
        {isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-dark-bg animate-pulse" />
        )}
      </button>
    </div>
  );
}
