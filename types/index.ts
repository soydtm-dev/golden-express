export interface Courier {
  id: string;
  name: string;
  phone?: string;
  vehicle_info: string;
  status: "disponible" | "ocupado" | "desconectado";
  is_admin?: boolean;
}

export interface ChatSession {
  id: string;
  courier_id: string;
  customer_name: string;
  customer_phone?: string;
  status: "abierto" | "cerrado";
  created_at?: string;
}

export interface Message {
  id: string;
  chat_session_id: string;
  sender: "cliente" | "repartidor";
  content: string;
  created_at?: string;
}

export interface Order {
  id?: string;
  courier_id: string;
  chat_session_id?: string;
  origin: string;
  destination: string;
  description?: string;
  price: number;
  created_at?: string;
}
