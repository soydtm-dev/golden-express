"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import InviteEmail from "@/emails/InviteEmail";

export interface InviteResult {
  success: boolean;
  message: string;
}

export interface InviteCourierInput {
  email: string;
  name?: string;
  vehicle_info?: string;
  phone?: string;
  is_admin?: boolean;
}

/**
 * Server Action para invitar a un nuevo repartidor o administrador.
 * 
 * Flujo de ejecución:
 * 1. Genera un enlace de invitación mediante `supabaseAdmin.auth.admin.generateLink` (crea el usuario en Auth sin enviar correo automático).
 * 2. Extrae el `user.id` e inserta el perfil completo en la tabla `public.couriers`.
 * 3. ROLLBACK DE SEGURIDAD: En caso de que el INSERT en `couriers` falle, elimina al usuario recién creado de Auth (`deleteUser`).
 * 4. Renderiza la plantilla de React Email a HTML y la envía a través de tu servidor SMTP (o Resend como alternativa).
 */
export async function inviteCourier(formData: InviteCourierInput): Promise<InviteResult> {
  const { email, name, vehicle_info, phone, is_admin = false } = formData;

  if (!email || !email.trim()) {
    return {
      success: false,
      message: "Por favor ingresa una dirección de correo electrónico válida.",
    };
  }

  // Comprobar si hay credenciales SMTP o API Key de Resend disponibles
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER;
  const resendApiKey = process.env.RESEND_API_KEY;
  const hasResendConfig = resendApiKey && resendApiKey !== "re_your_api_key_here";

  if (!hasSmtpConfig && !hasResendConfig) {
    return {
      success: false,
      message: "Falta configuración de correo: Configura las variables SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS) o la variable RESEND_API_KEY en tu archivo .env o .env.local",
    };
  }

  try {
    // Paso 1: Generar token/enlace de invitación con Supabase Auth (Crea usuario en Auth pero NO envía correo)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: email.trim(),
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
        data: {
          is_admin: is_admin,
          name: name?.trim() || "",
        },
      },
    });

    if (linkError || !linkData?.user) {
      console.error("Error al generar enlace de invitación en Supabase Auth:", linkError);
      let friendlyMessage = linkError?.message || "Error al generar la invitación en Supabase Auth.";
      if (linkError?.message?.toLowerCase().includes("already been registered")) {
        friendlyMessage = `El correo electrónico '${email}' ya pertenece a un usuario registrado en la plataforma.`;
      }
      return {
        success: false,
        message: friendlyMessage,
      };
    }

    const userId = linkData.user.id;
    const inviteLink = linkData.properties?.action_link;

    if (!inviteLink) {
      console.error("No se pudo obtener el enlace de invitación (action_link). Ejecutando rollback...");
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return {
        success: false,
        message: "No se pudo generar el enlace de invitación para el correo especificado.",
      };
    }

    const courierName = name?.trim() || email.trim().split("@")[0];
    const courierVehicle = vehicle_info?.trim() || "Sin especificar";
    const courierPhone = phone?.trim() || null;

    // Paso 2: Insertar el perfil completo en la tabla public.couriers
    const { error: dbError } = await supabaseAdmin
      .from("couriers")
      .insert({
        id: userId,
        name: courierName,
        vehicle_info: courierVehicle,
        phone: courierPhone,
        is_admin: is_admin,
        status: "desconectado",
      });

    // Paso 3: Bloque de seguridad con ROLLBACK
    if (dbError) {
      // =========================================================================
      // ROLLBACK DE SEGURIDAD:
      // Si la inserción en la base de datos ('couriers') falla, eliminamos al
      // usuario recién creado en Supabase Auth mediante deleteUser(userId)
      // para evitar inconsistencias y cuentas huérfanas en el sistema.
      // =========================================================================
      console.error("Error al insertar en la tabla 'couriers'. Ejecutando ROLLBACK en Auth...", dbError);
      
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (rollbackError) {
        console.error("Error crítico durante el rollback de eliminación de usuario:", rollbackError);
      }

      return {
        success: false,
        message: `Error al guardar el perfil en la base de datos: ${dbError.message}. Se realizó el rollback de la cuenta.`,
      };
    }

    // Paso 4: Renderizar la plantilla React Email a HTML
    const emailHtml = await render(InviteEmail({
      inviteLink: inviteLink,
      courierName: courierName,
    }));

    // Paso 5: Enviar el correo usando SMTP (o Resend como fallback)
    try {
      if (hasSmtpConfig) {
        // Envío mediante servidor SMTP (Nodemailer)
        const smtpPort = Number(process.env.SMTP_PORT) || 587;
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: smtpPort,
          secure: smtpPort === 465, // true para puerto 465, false para 587 u otros
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const fromEmail = process.env.SMTP_FROM || `"Golden Express" <${process.env.SMTP_USER}>`;

        await transporter.sendMail({
          from: fromEmail,
          to: email.trim(),
          subject: "Invitación a la plataforma - Golden Express",
          html: emailHtml,
        });
      } else if (hasResendConfig) {
        // Envío mediante API de Resend
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Golden Express <onboarding@resend.dev>";
        const { error: resendErr } = await resend.emails.send({
          from: fromEmail,
          to: [email.trim()],
          subject: "Invitación a la plataforma - Golden Express",
          html: emailHtml,
        });

        if (resendErr) {
          throw new Error(resendErr.message);
        }
      }
    } catch (emailException: any) {
      console.error("Excepción al intentar enviar el correo por SMTP/Resend:", emailException);
      return {
        success: false,
        message: `El usuario fue registrado correctamente en Auth y BD, pero falló el envío del correo: ${emailException.message}`,
      };
    }

    // Paso 6: Revalidar la ruta para actualizar la UI del panel de administración
    revalidatePath("/dashboard/admin/users");

    return {
      success: true,
      message: `¡Invitación enviada con éxito a ${email}!`,
    };
  } catch (err: any) {
    console.error("Excepción inesperada durante el proceso de invitación:", err);
    return {
      success: false,
      message: err.message || "Ocurrió un error inesperado al procesar la invitación.",
    };
  }
}
