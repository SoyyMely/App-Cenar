const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────
// Función principal para enviar correos
// ─────────────────────────────────────────────

const enviarCorreo = async ({ to, subject, html, text, attachments }) => {
  if (!to || !subject || !html) {
    console.error('❌ Faltan campos obligatorios para enviar correo: to, subject y html son requeridos');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Cenar <onboarding@resend.dev>',
      to,
      subject,
      html,
      text: text || undefined,
      attachments: attachments || undefined
    });

    if (error) {
      console.error(`❌ Error al enviar correo a ${to}:`, error.message || error);
      return null;
    }

    console.log(`📧 Correo enviado a ${to} — ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Error al enviar correo a ${to}:`, error.message);
    return null;
  }
};

module.exports = enviarCorreo;