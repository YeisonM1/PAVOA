const APP_URL  = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';
const LOGO_URL = `${APP_URL}/logo-pavoa.png`;

/**
 * Wrapper de email HTML con el branding de PAVOA.
 */
const emailWrapper = (bodyHTML) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F2E4E1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">

          <!-- HEADER CON LOGO -->
          <tr>
            <td align="center" style="padding:40px 40px 32px;border-bottom:1px solid #F2E4E1;">
              <img src="${LOGO_URL}" alt="PAVOA" width="120" style="display:block;height:auto;max-height:48px;object-fit:contain;" />
            </td>
          </tr>

          ${bodyHTML}

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:32px 40px 40px;">
              <div style="border-top:1px solid #F2E4E1;padding-top:28px;">
                <img src="${LOGO_URL}" alt="PAVOA" width="72" style="display:block;margin:0 auto 16px;height:auto;opacity:0.4;" />
                <p style="font-size:9px;letter-spacing:0.2em;color:#d1d5db;text-transform:uppercase;margin:0;">
                  © 2026 PAVOA. Todos los derechos reservados.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Email de confirmación de pedido.
 */
export const emailConfirmacion = ({ firstName, orderName, paymentId, lineItems, total, totalOriginal, descuentoAplicado, direccion }) => {
  const lineItemsHTML = (lineItems || []).map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f5f0eb;">
        <p style="margin:0;font-size:12px;color:#0B0B0B;letter-spacing:0.05em;">${item.title}</p>
        ${item.variant_title && item.variant_title !== 'Default Title'
          ? `<p style="margin:4px 0 0;font-size:10px;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;">${item.variant_title}</p>`
          : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f5f0eb;text-align:center;font-size:11px;color:#6b7280;">
        × ${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f5f0eb;text-align:right;font-size:12px;color:#0B0B0B;font-weight:600;">
        $${Number(item.price).toLocaleString('es-CO')}
      </td>
    </tr>
  `).join('');

  const body = `
          <!-- SALUDO -->
          <tr>
            <td style="padding:36px 40px 8px;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">Confirmación de pedido</p>
              <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                Hola, ${firstName}
              </h1>
              <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:20px;"></div>
              <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                Tu pago fue aprobado y tu pedido está confirmado. Pronto nos pondremos en contacto para coordinar la entrega.
              </p>
            </td>
          </tr>

          <!-- NÚMERO DE ORDEN -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:16px 20px;">
                <tr>
                  <td>
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 4px 0;">Número de pedido</p>
                    <p style="font-size:16px;font-weight:600;color:#0B0B0B;letter-spacing:0.1em;margin:0;">${orderName}</p>
                  </td>
                  <td align="right">
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 4px 0;">Pago</p>
                    <p style="font-size:12px;color:#0B0B0B;letter-spacing:0.05em;margin:0;">MP #${paymentId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRODUCTOS -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#0B0B0B;text-transform:uppercase;margin:0 0 16px 0;font-weight:700;">Detalle del pedido</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${lineItemsHTML}
                ${descuentoAplicado ? `
                <tr>
                  <td colspan="2" style="padding-top:12px;">
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0;">Subtotal</p>
                  </td>
                  <td style="padding-top:12px;text-align:right;">
                    <p style="font-size:13px;color:#9ca3af;margin:0;text-decoration:line-through;">$${totalOriginal}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:6px;">
                    <p style="font-size:10px;letter-spacing:0.2em;color:#DFCDB4;text-transform:uppercase;margin:0;">✦ Descuento bienvenida (−10%)</p>
                  </td>
                  <td style="padding-top:6px;text-align:right;">
                    <p style="font-size:13px;color:#DFCDB4;margin:0;">−$${Math.round(Number(total.replace(/[^0-9]/g, '')) / 0.9 * 0.1).toLocaleString('es-CO')}</p>
                  </td>
                </tr>` : ''}
                <tr>
                  <td colspan="2" style="padding-top:16px;">
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0;">Total pagado</p>
                  </td>
                  <td style="padding-top:16px;text-align:right;">
                    <p style="font-size:18px;font-weight:700;color:#0B0B0B;margin:0;">$${total}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${direccion ? `
          <tr>
            <td style="padding:28px 40px 0;">
              <div style="border-top:1px solid #F2E4E1;padding-top:24px;">
                <p style="font-size:10px;letter-spacing:0.3em;color:#0B0B0B;text-transform:uppercase;margin:0 0 10px 0;font-weight:700;">Dirección de entrega</p>
                <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">${direccion}</p>
              </div>
            </td>
          </tr>` : ''}

          <!-- MENSAJE FINAL -->
          <tr>
            <td style="padding:28px 40px 0;">
              <div style="border-top:1px solid #F2E4E1;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                  Si tienes alguna pregunta sobre tu pedido, escríbenos por WhatsApp y con gusto te ayudamos.
                </p>
              </div>
            </td>
          </tr>`;

  return emailWrapper(body);
};

/**
 * Email de despacho / actualización de guía.
 */
export const emailDespacho = ({ nombreCliente, orderName, subtitulo, cuerpo, trackingCompany, trackingNumber, trackingUrl }) => {
  const body = `
          <tr>
            <td style="padding:36px 40px 8px;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">${subtitulo}</p>
              <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                Hola, ${nombreCliente}
              </h1>
              <p style="font-size:11px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 16px 0;">Pedido ${orderName}</p>
              <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:20px;"></div>
              <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">${cuerpo}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:20px;">
                <tr>
                  <td>
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 6px 0;">Transportadora</p>
                    <p style="font-size:15px;font-weight:600;color:#0B0B0B;letter-spacing:0.05em;margin:0;">${trackingCompany}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 6px 0;">Número de guía</p>
                    <p style="font-size:20px;font-weight:700;color:#0B0B0B;letter-spacing:0.1em;margin:0;">${trackingNumber}</p>
                  </td>
                </tr>
                ${trackingUrl ? `
                <tr>
                  <td style="padding-top:20px;">
                    <a href="${trackingUrl}" style="display:inline-block;background-color:#0B0B0B;color:#ffffff;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;">
                      Rastrear pedido →
                    </a>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <div style="border-top:1px solid #F2E4E1;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                  También puedes ver el estado de tu pedido en cualquier momento desde tu cuenta en PAVOA.
                </p>
              </div>
            </td>
          </tr>`;

  return emailWrapper(body);
};

/**
 * Email de entrega confirmada.
 */
export const emailEntregado = ({ nombreCliente, orderName }) => {
  const body = `
          <tr>
            <td style="padding:36px 40px 8px;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">Pedido entregado</p>
              <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                Hola, ${nombreCliente}
              </h1>
              <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:20px;"></div>
              <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                Tu pedido <strong>${orderName}</strong> ha sido entregado. Esperamos que lo disfrutes mucho.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:24px;">
                <tr>
                  <td align="center">
                    <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 10px 0;">Número de pedido</p>
                    <p style="font-size:20px;font-weight:700;color:#0B0B0B;letter-spacing:0.15em;margin:0;">${orderName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <div style="border-top:1px solid #F2E4E1;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                  Gracias por confiar en PAVOA. Si tienes alguna duda sobre tu pedido no dudes en contactarnos.
                </p>
              </div>
            </td>
          </tr>`;

  return emailWrapper(body);
};

/**
 * Email de verificación de cuenta.
 */
export const emailVerificacion = ({ firstName, verifyLink }) => {
  const body = `
          <tr>
            <td style="padding-top:32px;padding-bottom:24px;padding-left:40px;padding-right:40px;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">Bienvenida</p>
              <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                Hola, ${firstName}
              </h1>
              <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:24px;"></div>
              <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0 0 32px 0;">
                Gracias por unirte a PAVOA. Para activar tu cuenta y comenzar a explorar nuestra colección, verifica tu dirección de correo electrónico.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${verifyLink}"
                 style="display:inline-block;background-color:#0B0B0B;color:#ffffff;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;padding:16px 40px;">
                Verificar correo
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #F2E4E1;padding-top:24px;padding-left:40px;padding-right:40px;">
              <p style="font-size:11px;color:#9ca3af;line-height:1.6;margin:0;text-align:center;">
                Este enlace expira en 24 horas.<br>
                Si no creaste esta cuenta, ignora este correo.
              </p>
            </td>
          </tr>`;

  return emailWrapper(body);
};
