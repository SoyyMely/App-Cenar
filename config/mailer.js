const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────
// Función principal para enviar correos
// ─────────────────────────────────────────────

const enviarCorreo = async ({ to, subject, html, text, attachments }) => {
  if (!to || !subject || !html) {
    throw new Error('Faltan campos obligatorios: to, subject y html son requeridos');
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
      throw new Error(error.message || 'Error al enviar correo');
    }

    console.log(`📧 Correo enviado a ${to} — ID: ${data.id}`);

    return data;
  } catch (error) {
    console.error(`❌ Error al enviar correo a ${to}:`, error.message);
    throw error;
  }
};

module.exports = enviarCorreo;