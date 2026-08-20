# 🏍️ Guía del Repartidor - Golden Express

Bienvenido a la guía oficial para los repartidores de **Golden Express**. En este documento aprenderás a utilizar el panel de control para gestionar tu disponibilidad en tiempo real, interactuar con clientes, registrar entregas y administrar tu perfil profesional.

---

## 📋 Tabla de Contenidos
1. [Acceso e Inicio de Sesión](#1-acceso-e-inicio-de-sesión)
2. [Gestión del Estado de Disponibilidad](#2-gestión-del-estado-de-disponibilidad)
3. [Atención de Chats en Tiempo Real](#3-atención-de-chats-en-tiempo-real)
4. [Registro de Pedidos y Cierre de Chat](#4-registro-de-pedidos-y-cierre-de-chat)
5. [Consulta del Historial de Envíos](#5-consulta-del-historial-de-envíos)
6. [Gestión de Perfil y Vehículo](#6-gestión-de-perfil-y-vehículo)

---

## 🔑 1. Acceso e Inicio de Sesión

1. Ingresa a la sección de inicio de sesión de la plataforma (ej. `http://localhost:3000/login`).
2. Introduce tu **correo electrónico** y tu **contraseña**.
3. Haz clic en **"Iniciar Sesión"**. Al autenticarte correctamente, el sistema te redirigirá a tu **Panel de Control** (`/dashboard`).
4. Si olvidaste tu contraseña, utiliza el enlace **"¿Olvidaste tu contraseña?"** para recibir las instrucciones de recuperación en tu correo.

---

## 🟢 2. Gestión del Estado de Disponibilidad

Tu estado determina si los clientes pueden iniciarte chats desde la página principal:

* Ubica el selector de estado en la parte superior derecha de tu pantalla o en la barra móvil.
* Puedes alternar entre 3 estados:
  * 🟢 **Disponible:** Aparecerás activo en la web y los clientes podrán iniciar conversaciones contigo para solicitar servicios.
  * 🟠 **Ocupado:** Te mostrarás realizando una entrega. Los clientes sabrán que estás en ruta, pero aún podrán chatear contigo.
  * 🔴 **No Disponible / Desconectado:** Inhabilitará el botón de chat para clientes en la web pública. Utiliza esta opción cuando termines tu turno de trabajo.

---

## 💬 3. Atención de Chats en Tiempo Real

1. En la pestaña **"Pedidos Activos"** (`/dashboard`), verás el panel con la lista de chats abiertos iniciados por los clientes.
2. Cada conversación mostrará el nombre del cliente y su teléfono de contacto (si lo proporcionó).
3. **Enviar y recibir mensajes:**
   * Haz clic en una conversación para abrir la sala de chat.
   * Responde en tiempo real a las consultas del cliente.
   * Solicita los detalles exactos: **Lugar de Recogida (Origen)**, **Lugar de Entrega (Destino)** y la **Descripción del Producto**.
   * Acuerda la tarifa final del servicio de delivery.

---

## 📦 4. Registro de Pedidos y Cierre de Chat

Una vez acordados los detalles y la tarifa con el cliente:

1. En la parte superior del chat activo, presiona el botón **"Pedir"** o **"Registrar Pedido"**.
2. Se abrirá un formulario modal donde deberás ingresar:
   * **Origen (Requerido):** Dirección donde recogerás el pedido.
   * **Destino (Requerido):** Dirección exacta de entrega al cliente.
   * **Descripción (Opcional):** Notas del paquete o contenido.
   * **Precio (Requerido):** El monto total ($) acordado por el servicio.
3. Haz clic en **"Guardar Pedido"**.
4. **Efecto automático:** El pedido quedará registrado en la base de datos, el chat se marcará como **"Cerrado"** y se removerá de tu lista de chats activos. Al cliente se le notificará que el pedido fue guardado y se iniciará un cooldown de 3 minutos.

---

## 📜 5. Consulta del Historial de Envíos

1. Dirígete a la pestaña **"Historial de Envíos"** (`/dashboard/history`) en el menú lateral.
2. Podrás visualizar todas tus entregas registradas en orden cronológico inverso.
3. **Buscador interactivo:** Puedes filtrar por calle de destino, dirección de origen o nombre del cliente.
4. Consulta detalles como fechas, montos cobrados y ubicaciones de entregas finalizadas.

---

## 👤 6. Gestión de Perfil y Vehículo

1. Ve a la sección **"Mi Perfil"** (`/dashboard/profile`).
2. Podrás actualizar tus datos de presentación:
   * **Nombre completo.**
   * **Número de teléfono.**
   * **Información del Vehículo:** Describe tu medio de transporte (ej. *"Moto Honda CB125 Red"* o *"Bicicleta Trek Black"*). Esto cambiará el ícono representativo (Moto, Bici o Carro) que ven los clientes.
3. **Cambiar Contraseña:** Dentro del perfil, haz clic en **"Cambiar Contraseña"** si necesitas actualizar tu clave de acceso.

---

¡Mantén siempre actualizado tu estado y bríndale a tus clientes la velocidad y confianza de **Golden Express**! 🚀
