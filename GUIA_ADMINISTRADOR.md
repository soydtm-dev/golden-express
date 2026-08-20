# 🛡️ Guía del Repartidor Administrador - Golden Express

Esta guía está dirigida a los usuarios con rol de **Repartidor Administrador** en **Golden Express**. Como administrador, posees todas las funciones operativas de un repartidor estándar (gestión de disponibilidades, atención de chats y registro de pedidos) sumadas a privilegios de gestión de personal, invitación de usuarios y administración de la flota.

---

## 📋 Tabla de Contenidos
1. [El Rol de Repartidor Administrador](#1-el-rol-de-repartidor-administrador)
2. [Acceso al Panel de Administración](#2-acceso-al-panel-de-administración)
3. [Gestión de Personal y Repartidores](#3-gestión-de-personal-y-repartidores)
   * [Invitar un Nuevo Repartidor o Administrador](#invitar-un-nuevo-repartidor-o-administrador)
   * [Búsqueda y Filtrado de Usuarios](#búsqueda-y-filtrado-de-usuarios)
   * [Restablecer Contraseñas de Usuarios](#restablecer-contraseñas-de-usuarios)
   * [Eliminación Permanente de Usuarios](#eliminación-permanente-de-usuarios)
4. [Supervisión Global de Operaciones](#4-supervisión-global-de-operaciones)
5. [Buenas Prácticas de Seguridad](#5-buenas-prácticas-de-seguridad)

---

## 🎖️ 1. El Rol de Repartidor Administrador

Un usuario con privilegios de administración puede:
* Operar normalmente en la calle o atender entregas asignadas.
* Cambiar su estado de disponibilidad (Disponible, Ocupado, Desconectado).
* Registrar pedidos a partir de los chats con los clientes.
* **Gestionar la flota de personal:** Dar de alta nuevos repartidores, enviar invitaciones por correo, restablecer credenciales y dar de baja usuarios.

---

## 🔑 2. Acceso al Panel de Administración

1. Inicia sesión con tus credenciales administrativas en `/login`.
2. En la barra de navegación lateral (Sidebar) o menú móvil, se desplegará una sección exclusiva titulada **"Administración"**.
3. Haz clic en **"Gestión de Personal"** (Ruta: `/dashboard/admin/users`).

---

## 👥 3. Gestión de Personal y Repartidores

### 📩 Invitar un Nuevo Repartidor o Administrador
1. En la pantalla de **Gestión de Personal**, haz clic en el botón **"+ Invitar Repartidor"**.
2. Completa los datos en el modal:
   * **Correo Electrónico:** Dirección de email del nuevo miembro.
   * **¿Asignar Rol Administrador?:** Marca la casilla si deseas concederle permisos administrativos completos. Déjala desmarcada si será un repartidor estándar.
3. Presiona **"Enviar Invitación"**. El usuario recibirá un correo electrónico con las instrucciones para establecer su contraseña e ingresar al sistema.

### 🔍 Búsqueda y Filtrado de Usuarios
* Utiliza la barra de búsqueda en la parte superior para encontrar usuarios por nombre, correo electrónico o número telefónico.
* En cada tarjeta se mostrará una etiqueta distintiva:
  * 👑 **Administrador:** Usuario con permisos de gestión de personal.
  * 📦 **Repartidor:** Usuario operativo estándar.

### 🔑 Restablecer Contraseñas de Usuarios
Si un repartidor olvida su contraseña o requiere ayuda para acceder:
1. Ubica la tarjeta del repartidor en la lista.
2. Haz clic en el ícono de la llave **"Restablecer Clave"** (o envía el correo de recuperación).
3. El sistema enviará automáticamente un enlace seguro al correo registrado del repartidor para que defina una nueva contraseña.

### 🗑️ Eliminación Permanente de Usuarios
Si un repartidor ya no forma parte de la empresa:
1. En la tarjeta del repartidor, haz clic en el botón de papelera **"Eliminar"**.
2. Se abrirá una ventana de confirmación advirtiendo que la acción es irreversible.
3. Confirma la eliminación. El usuario será dado de baja tanto en el registro de autenticación de Supabase como en la tabla de couriers del sistema.

---

## 📊 4. Supervisión Global de Operaciones

Como administrador, tienes acceso a la visión general de la plataforma:
* **Historial Global:** En `/dashboard/history` puedes auditar todos los envíos realizados por cualquier miembro de la flota.
* **Verificación de Flota en Tiempo Real:** Puedes visualizar desde la página pública qué repartidores están disponibles u ocupados en cada momento.

---

## 🔒 5. Buenas Prácticas de Seguridad

* **Principio de Mínimo Privilegio:** Concede el rol de Administrador únicamente al personal de confianza que requiera gestionar la flota.
* **Limpieza de Cuentas Inactivas:** Elimina oportunamente las cuentas de repartidores que hayan dejado de colaborar con Golden Express.
* **Seguridad de Credenciales:** Asegúrate de mantener una contraseña robusta en tu cuenta de administrador.

---

¡Gracias por liderar la flota y mantener la excelencia operativa en **Golden Express**! 🚀
