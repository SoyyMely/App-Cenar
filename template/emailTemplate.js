
const emailTemplate = ({ titulo, mensaje, botonTexto, botonUrl }) => `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:#ff6b35; padding:24px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:24px;">Cenar</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#333333; margin-top:0;">${titulo}</h2>
              <p style="color:#555555; font-size:16px; line-height:1.5;">${mensaje}</p>
              ${
                botonUrl
                  ? `
              <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="background-color:#ff6b35; border-radius:6px;">
                    <a href="${botonUrl}" style="display:inline-block; padding:12px 24px; color:#ffffff; text-decoration:none; font-weight:bold;">
                      ${botonTexto || 'Ver más'}
                    </a>
                  </td>
                </tr>
              </table>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f7; padding:16px; text-align:center;">
              <p style="color:#999999; font-size:12px; margin:0;">
                © ${new Date().getFullYear()} Cenar. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = emailTemplate;
