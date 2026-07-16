"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export interface InviteResult {
  success: boolean;
  message: string;
}

/**
 * Server Action para invitar a un nuevo repartidor o administrador.
 * Envía la invitación por correo electrónico y crea el registro correspondiente en la tabla 'couriers'.
 */
export interface InviteResult {
  success: boolean;
  message: string;
}

/**
 * Server Action para invitar a un nuevo repartidor o administrador.
 * Envía la invitación por correo electrónico. Los datos del perfil (nombre, teléfono, vehículo)
 * serán registrados por el usuario invitado al definir su contraseña.
 */
export async function inviteCourier(formData: {
  email: string;
  is_admin?: boolean;
}): Promise<InviteResult> {
  const { email, is_admin = false } = formData;

  if (!email || !email.trim()) {
    return {
      success: false,
      message: "Por favor ingresa una dirección de correo electrónico válida."
    };
  }

  try {
    // Paso A: Invitar al usuario mediante Supabase Auth Admin API
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/update-password`,
      data: {
        is_admin: is_admin
      }
    });

    if (inviteError) {
      console.error("Error al invitar al usuario en Supabase Auth:", inviteError);
      let friendlyMessage = inviteError.message || "Error al enviar la invitación por correo electrónico.";
      if (inviteError.message?.toLowerCase().includes("already been registered")) {
        friendlyMessage = `El correo electrónico '${email}' ya pertenece a un usuario registrado en la plataforma.`;
      }
      return {
        success: false,
        message: friendlyMessage
      };
    }

    // Revalidar el path para actualizar las vistas administrativas
    revalidatePath("/dashboard/admin/users");

    return {
      success: true,
      message: `¡Invitación enviada con éxito a ${email}!`
    };
  } catch (err: any) {
    console.error("Excepción durante la invitación de usuario:", err);
    return {
      success: false,
      message: err.message || "Ocurrió un error inesperado al procesar la invitación."
    };
  }
}
