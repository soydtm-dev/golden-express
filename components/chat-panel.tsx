"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Paperclip, Loader2, User, Phone, CheckCheck, AlertCircle, Clock } from "lucide-react";
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
  
  // Estado de tiempo de espera (3 minutos = 180s)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  
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

  // Manejador del temporizador de Cooldown (3 minutos tras cerrar el chat)
  useEffect(() => {
    if (!selectedCourier) {
      setCooldownRemaining(0);
      return;
    }

    const cooldownKey = `golden_express_cooldown_${selectedCourier.id}`;

    const checkCooldown = () => {
      const untilStr = localStorage.getItem(cooldownKey);
      if (untilStr) {
        const until = Number(untilStr);
        const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        setCooldownRemaining(remaining);
        if (remaining <= 0) {
          localStorage.removeItem(cooldownKey);
        }
      } else {
        setCooldownRemaining(0);
      }
    };

    checkCooldown();
    const timer = setInterval(checkCooldown, 1000);
    return () => clearInterval(timer);
  }, [selectedCourier, sessionStatus]);

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

        const { data: msgs, error: msgsError } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_session_id", session.id)
          .order("created_at", { ascending: true });

        if (!msgsError) {
          setMessages(msgs || []);
        }

        // Si la sesión está cerrada, establecer el cooldown de 3 minutos
        if (session.status === "cerrado") {
          localStorage.removeItem(`golden_express_session_${selectedCourier.id}`);
          const cooldownKey = `golden_express_cooldown_${selectedCourier.id}`;
          if (!localStorage.getItem(cooldownKey)) {
            localStorage.setItem(cooldownKey, (Date.now() + 3 * 60 * 1000).toString());
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

  // Suscribirse en Tiempo Real (Realtime + Polling de Respaldo)
  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();

    const syncMessages = async () => {
      try {
        const { data: msgs, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_session_id", sessionId)
          .order("created_at", { ascending: true });

        if (!error && msgs) {
          setMessages((prev) => {
            const tempMsgs = prev.filter(
              (m) => m.id.startsWith("temp-") && !msgs.some((rm) => rm.content === m.content && rm.sender === m.sender)
            );
            return [...msgs, ...tempMsgs];
          });
        }
      } catch (err) {
        console.error("Error en sincronización de mensajes:", err);
      }
    };

    const syncSession = async () => {
      try {
        const { data: sess } = await supabase
          .from("chat_sessions")
          .select("status")
          .eq("id", sessionId)
          .maybeSingle();

        if (sess && sess.status) {
          setSessionStatus(sess.status);
          if (sess.status === "cerrado" && selectedCourier) {
            localStorage.removeItem(`golden_express_session_${selectedCourier.id}`);
            const cooldownKey = `golden_express_cooldown_${selectedCourier.id}`;
            if (!localStorage.getItem(cooldownKey)) {
              localStorage.setItem(cooldownKey, (Date.now() + 3 * 60 * 1000).toString());
            }
          }
        }
      } catch (err) {
        console.error("Error en sincronización de sesión:", err);
      }
    };

    const messagesChannel = supabase
      .channel(`client-messages-${sessionId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const filtered = prev.filter(
                (m) => !(m.id.startsWith("temp-") && m.content === newMsg.content && m.sender === newMsg.sender)
              );
              return [...filtered, newMsg];
            });
          }
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`client-session-${sessionId}-${Date.now()}`)
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
          if (updatedSession.status === "cerrado" && selectedCourier) {
            localStorage.removeItem(`golden_express_session_${selectedCourier.id}`);
            const cooldownKey = `golden_express_cooldown_${selectedCourier.id}`;
            if (!localStorage.getItem(cooldownKey)) {
              localStorage.setItem(cooldownKey, (Date.now() + 3 * 60 * 1000).toString());
            }
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      syncMessages();
      syncSession();
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, selectedCourier]);

  // Scroll automático hacia el último mensaje recibido o enviado
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Formato para el segundero del Cooldown M:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Crear una sesión de chat inicial en la base de datos
  const handleStartChatSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourier || !clientName.trim() || cooldownRemaining > 0) return;

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

  // Enviar un mensaje de chat con actualización optimista inmediata
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId || sessionStatus !== "abierto") return;

    const messageText = inputText.trim();
    setInputText("");

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      chat_session_id: sessionId,
      sender: "cliente",
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const supabase = createClient();

      const { data: insertedMsg, error } = await supabase
        .from("messages")
        .insert({
          chat_session_id: sessionId,
          sender: "cliente",
          content: messageText
        })
        .select()
        .single();

      if (error) throw error;

      if (insertedMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? insertedMsg : m))
        );
      }
    } catch (err) {
      console.error("Error al enviar el mensaje:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputText(messageText);
    }
  };

  const handleResetChatSession = () => {
    if (cooldownRemaining > 0) return;
    if (selectedCourier) {
      localStorage.removeItem(`golden_express_session_${selectedCourier.id}`);
    }
    setSessionId(null);
    setSessionStatus(null);
    setMessages([]);
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

                {cooldownRemaining > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                    <div>
                      <span className="font-semibold block text-[11px]">Tiempo de espera activo:</span>
                      <span className="text-[10px] text-amber-300/90">
                        Debes esperar <strong className="font-mono font-bold text-amber-300">{formatTime(cooldownRemaining)} min</strong> para abrir un nuevo chat con este repartidor.
                      </span>
                    </div>
                  </div>
                )}

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
                      disabled={cooldownRemaining > 0}
                      className="w-full bg-gray-950 border border-gray-805 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-250 focus:outline-none focus:border-gold-500/50 disabled:opacity-50"
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
                      disabled={cooldownRemaining > 0}
                      className="w-full bg-gray-950 border border-gray-805 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-250 focus:outline-none focus:border-gold-500/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cooldownRemaining > 0}
                  className="w-full bg-gold-500 text-gray-900 font-bold py-2.5 rounded-xl text-xs hover:bg-gold-600 active:scale-95 transition-all shadow-[0_2px_10px_rgba(245,158,11,0.15)] mt-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed animate-in fade-in-50 duration-200"
                >
                  {cooldownRemaining > 0 ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Disponible en {formatTime(cooldownRemaining)} min</span>
                    </span>
                  ) : (
                    <span>Iniciar Chat</span>
                  )}
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

                {/* Banner de Chat Finalizado / Cerrado por el Repartidor con Cooldown */}
                {sessionStatus === "cerrado" && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-center p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 animate-in fade-in duration-300 shrink-0">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span>Esta conversación ha sido finalizada por el repartidor.</span>
                    </div>
                    <p className="text-[10px] text-red-300/80 font-normal">
                      El chat está cerrado y no se pueden enviar más mensajes.
                    </p>

                    {cooldownRemaining > 0 ? (
                      <div className="mt-1 flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span>Nueva conversación en: {formatTime(cooldownRemaining)} min</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResetChatSession}
                        className="mt-1 px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        Iniciar Nueva Conversación
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Formulario de Envío de Mensaje (Solo visible si el chat está ABIERTO) */}
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
