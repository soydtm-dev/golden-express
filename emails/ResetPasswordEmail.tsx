import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
  resetLink: string;
  courierName?: string;
}

export const ResetPasswordEmail = ({
  resetLink,
  courierName,
}: ResetPasswordEmailProps) => {
  const displayName = courierName && courierName.trim() ? courierName : "Usuario";

  return (
    <Html>
      <Head />
      <Preview>Restablecimiento de Contraseña - Golden Express</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header con marca */}
          <Section style={headerSection}>
            <Heading style={brandTitle}>GOLDEN EXPRESS</Heading>
            <Text style={subTitle}>Sistema Logístico & Entregas</Text>
          </Section>

          <Hr style={divider} />

          {/* Contenido principal */}
          <Section style={contentSection}>
            <Heading style={heading}>¡Hola, {displayName}!</Heading>
            <Text style={text}>
              Se ha solicitado un restablecimiento de contraseña para tu cuenta en{" "}
              <strong style={goldText}>Golden Express</strong>.
            </Text>
            <Text style={text}>
              Para definir una nueva contraseña de acceso y recuperar el ingreso a la plataforma, haz clic en el siguiente botón:
            </Text>

            {/* Botón de Restablecer Contraseña */}
            <Section style={btnContainer}>
              <Button style={button} href={resetLink}>
                Restablecer Contraseña
              </Button>
            </Section>

            <Text style={smallText}>
              Si el botón no funciona, puedes copiar y pegar el siguiente enlace directamente en tu navegador:
            </Text>
            <Text style={linkText}>{resetLink}</Text>
          </Section>

          <Hr style={divider} />

          {/* Pie de página */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Si no solicitaste este cambio de contraseña, puedes ignorar este mensaje de forma segura. Tu cuenta permanece protegida.
            </Text>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Golden Express. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

// --- Estilos en línea (Inline CSS) ---
const main = {
  backgroundColor: "#0A0A0A",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#171717",
  border: "1px solid #262626",
  borderRadius: "16px",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "560px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
};

const headerSection = {
  textAlign: "center" as const,
  marginBottom: "20px",
};

const brandTitle = {
  color: "#D4AF37",
  fontSize: "24px",
  fontWeight: "800",
  letterSpacing: "2px",
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
};

const subTitle = {
  color: "#a3a3a3",
  fontSize: "12px",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const divider = {
  borderColor: "#262626",
  margin: "20px 0",
};

const contentSection = {
  padding: "10px 0",
};

const heading = {
  color: "#e5e7eb",
  fontSize: "20px",
  fontWeight: "700",
  marginBottom: "16px",
};

const text = {
  color: "#e5e7eb",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "12px 0",
};

const goldText = {
  color: "#D4AF37",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#D4AF37",
  borderRadius: "10px",
  color: "#0A0A0A",
  fontSize: "14px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  boxShadow: "0 4px 14px rgba(212, 175, 55, 0.3)",
};

const smallText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  marginTop: "24px",
  marginBottom: "6px",
};

const linkText = {
  color: "#D4AF37",
  fontSize: "12px",
  wordBreak: "break-all" as const,
};

const footerSection = {
  textAlign: "center" as const,
  marginTop: "20px",
};

const footerText = {
  color: "#6b7280",
  fontSize: "11px",
  lineHeight: "16px",
  margin: "4px 0",
};
