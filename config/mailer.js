const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

// ─────────────────────────────────────────────
// Configuración del transporter
// ─────────────────────────────────────────────

const transporter = nodemailer.createTransport(
  process.env.EMAIL_HOST
    ? {
        // Configuración SMTP genérica (Ethereal, Mailtrap, etc.)
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465, // true solo si usas puerto 465
        family: 4, // fuerza IPv4 (evita ENETUNREACH en Railway/entornos sin salida IPv6)
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    : {
        // Configuración para Gmail
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4, // fuerza IPv4 (evita ENETUNREACH en Railway/entornos sin salida IPv6)
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS 
        }
      }
);

// Verifica la conexión al iniciar 
transporter.verify((error) => {
  if (error) {
    console.error('❌ Error al conectar con el servidor de correo:', error.message);
  } else {
    console.log('✅ Servidor de correo listo para enviar mensajes');
  }
});

// ─────────────────────────────────────────────
// Función principal para enviar correos
// ─────────────────────────────────────────────

const enviarCorreo = async ({ to, subject, html, text, attachments }) => {
  if (!to || !subject || !html) {
    throw new Error('Faltan campos obligatorios: to, subject y html son requeridos');
  }

  try {
    const info = await transporter.sendMail({
      from: `"AppCenar" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || undefined, // fallback para clientes de correo sin HTML
      attachments: attachments || undefined
    });

    console.log(`📧 Correo enviado a ${to} — ID: ${info.messageId}`);

    // Si es Ethereal , muestra el link de vista previa
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('👀 Vista previa del correo:', previewUrl);
    }

    return info;
  } catch (error) {
    console.error(`❌ Error al enviar correo a ${to}:`, error.message);
    throw error;
  }
};

module.exports = enviarCorreo;