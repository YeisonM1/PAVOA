const APP_URL = process.env.VITE_APP_URL || "https://pavoa.vercel.app";
const LOGO_URL = `${APP_URL}/logo-pavoa.png`;
const MARK_URL = `${APP_URL}/pavoa-mark.png`;
const EMAIL_FONT_LINK = "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap";
const EMAIL_FONT_PRIMARY = "'Raleway', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const EMAIL_FONT_SECONDARY = "'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const EMAIL_COLOR_BG = "#F2E4E1";
const EMAIL_COLOR_IVORY = "#F6F1EA";
const EMAIL_COLOR_GOLD = "#DFCDB4";
const EMAIL_COLOR_GOLD_SOFT = "#EEE5D8";
const EMAIL_COLOR_BORDER = "#E0D8CE";
const EMAIL_COLOR_BLACK = "#0B0B0B";
const EMAIL_COLOR_CHARCOAL = "#3A3A3A";
const EMAIL_COLOR_MUTED = "#7B746B";
const EMAIL_COLOR_MUTED_SOFT = "#8A8175";

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (value) => Number(value || 0).toLocaleString("es-CO");

const formatVariantLabel = (value) => {
  const normalized = String(value || "").trim();
  return normalized && normalized !== "Default Title" ? normalized : "";
};

const renderButton = (href, label) => `
  <a href="${href}"
    style="display:inline-block;background-color:${EMAIL_COLOR_BLACK};color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;padding:15px 28px;border-radius:999px;font-family:${EMAIL_FONT_SECONDARY};border:1px solid ${EMAIL_COLOR_BLACK};">
    ${escapeHtml(label)}
  </a>
`;

const renderRow = (label, value, options = {}) => `
  <tr>
    <td style="padding:${options.padding || "12px 0"};${options.border === false ? "" : `border-bottom:1px solid ${EMAIL_COLOR_BORDER};`}font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};width:38%;vertical-align:top;font-family:${EMAIL_FONT_SECONDARY};">
      ${escapeHtml(label)}
    </td>
    <td style="padding:${options.padding || "12px 0"};${options.border === false ? "" : `border-bottom:1px solid ${EMAIL_COLOR_BORDER};`}font-size:14px;line-height:1.6;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_PRIMARY};">
      ${value}
    </td>
  </tr>
`;

const renderSection = (title, content) => `
  <tr>
    <td style="padding:28px 40px 0;font-family:${EMAIL_FONT_PRIMARY};">
      <div style="border-top:1px solid ${EMAIL_COLOR_GOLD_SOFT};padding-top:24px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};font-family:${EMAIL_FONT_SECONDARY};">
          ${escapeHtml(title)}
        </p>
        ${content}
      </div>
    </td>
  </tr>
`;

const renderInfoCard = (content) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_COLOR_GOLD_SOFT};background-color:${EMAIL_COLOR_IVORY};border-radius:16px;font-family:${EMAIL_FONT_PRIMARY};">
    <tr>
      <td style="padding:20px 22px;">
        ${content}
      </td>
    </tr>
  </table>
`;

const renderBrandLockup = () => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="padding:0 12px 0 0;vertical-align:middle;">
        <img src="${MARK_URL}" alt="" width="28" style="display:block;width:28px;height:auto;">
      </td>
      <td style="vertical-align:middle;">
        <img src="${LOGO_URL}" alt="PAVOA" width="210" style="display:block;width:210px;max-width:100%;height:auto;">
      </td>
    </tr>
  </table>
`;

const renderLayout = ({
  preheader,
  eyebrow,
  title,
  body,
  primaryCta,
  afterHero = "",
  footerNote = "Si necesitas ayuda, responde a este correo o escribenos desde PAVOA.",
}) => `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${EMAIL_FONT_LINK}" rel="stylesheet">
    <title>PAVOA</title>
  </head>
  <body style="margin:0;padding:0;background-color:${EMAIL_COLOR_BG};font-family:${EMAIL_FONT_PRIMARY};color:${EMAIL_COLOR_BLACK};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      ${escapeHtml(preheader || "")}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_COLOR_BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:${EMAIL_COLOR_IVORY};border:1px solid ${EMAIL_COLOR_GOLD};padding:10px;">
            <tr>
              <td style="border:1px solid ${EMAIL_COLOR_GOLD_SOFT};background-color:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:18px 32px 0;background-color:${EMAIL_COLOR_IVORY};">
                      <div style="width:100%;height:8px;background-color:${EMAIL_COLOR_GOLD};border-radius:999px 999px 0 0;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:26px 32px 24px;background-color:${EMAIL_COLOR_IVORY};border-bottom:1px solid ${EMAIL_COLOR_GOLD_SOFT};">
                      ${renderBrandLockup()}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 40px 10px;background-color:${EMAIL_COLOR_BG};">
                      <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
                        ${escapeHtml(eyebrow)}
                      </p>
                      <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;font-weight:600;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};">
                        ${escapeHtml(title)}
                      </h1>
                      <div style="width:44px;height:2px;background-color:${EMAIL_COLOR_GOLD};margin:0 0 20px;"></div>
                      <p style="margin:0;font-size:15px;line-height:1.8;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">
                        ${body}
                      </p>
                    </td>
                  </tr>

                  ${primaryCta ? `
                  <tr>
                    <td style="padding:28px 40px 0;background-color:${EMAIL_COLOR_BG};">
                      ${renderButton(primaryCta.href, primaryCta.label)}
                    </td>
                  </tr>` : ""}

                  ${afterHero}

                  <tr>
                    <td style="padding:32px 40px 40px;background-color:#ffffff;">
                      <div style="border-top:1px solid ${EMAIL_COLOR_GOLD_SOFT};padding-top:24px;">
                        <p style="margin:0;font-size:12px;line-height:1.7;color:${EMAIL_COLOR_MUTED};font-family:${EMAIL_FONT_PRIMARY};">
                          ${footerNote}
                        </p>
                        <p style="margin:18px 0 0;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
                          PAVOA
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const emailConfirmacion = ({
  firstName,
  orderName,
  paymentId,
  lineItems,
  total,
  totalOriginal,
  descuentoAplicado,
  dirección,
}) => {
  const itemsHtml = (lineItems || [])
    .map((item) => {
      const variantLabel = formatVariantLabel(item.variant_title);

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};">
            <p style="margin:0;font-size:14px;font-weight:600;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};">
              ${escapeHtml(item.title)}
            </p>
            ${variantLabel ? `
              <p style="margin:5px 0 0;font-size:12px;color:${EMAIL_COLOR_MUTED};font-family:${EMAIL_FONT_PRIMARY};">
                ${escapeHtml(variantLabel)}
              </p>` : ""}
          </td>
          <td style="padding:14px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};text-align:center;font-size:13px;color:${EMAIL_COLOR_MUTED};font-family:${EMAIL_FONT_PRIMARY};">
            x ${item.quantity}
          </td>
          <td style="padding:14px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};text-align:right;font-size:14px;font-weight:600;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};">
            $${formatMoney(item.price)}
          </td>
        </tr>
      `;
    })
    .join("");

  const summaryCard = renderInfoCard(`
    <table width="100%" cellpadding="0" cellspacing="0">
      ${renderRow("Pedido", `<strong style="font-size:16px;color:${EMAIL_COLOR_BLACK};">${escapeHtml(orderName)}</strong>`)}
      ${renderRow("Pago", `MP #${escapeHtml(paymentId)}`)}
      ${descuentoAplicado
        ? renderRow("Subtotal", `<span style="text-decoration:line-through;color:${EMAIL_COLOR_MUTED_SOFT};">$${escapeHtml(totalOriginal)}</span>`)
        : ""}
      ${descuentoAplicado
        ? renderRow("Beneficio", `<span style="color:${EMAIL_COLOR_BLACK};font-weight:600;">Descuento bienvenida aplicado</span>`)
        : ""}
      ${renderRow("Total pagado", `<strong style="font-size:18px;color:${EMAIL_COLOR_BLACK};">$${escapeHtml(total)}</strong>`, { border: false })}
    </table>
  `);

  const orderTable = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">Producto</td>
        <td style="padding-bottom:10px;text-align:center;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">Cant.</td>
        <td style="padding-bottom:10px;text-align:right;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">Valor</td>
      </tr>
      ${itemsHtml}
    </table>
  `;

  const shippingSection = dirección
    ? renderSection(
        "Direccion de entrega",
        `<p style="margin:0;font-size:14px;line-height:1.7;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">${escapeHtml(dirección)}</p>`,
      )
    : "";

  return renderLayout({
    preheader: `Pedido ${orderName} confirmado`,
    eyebrow: "Confirmacion de pedido",
    title: `Hola, ${firstName}`,
    body:
      "Tu pago fue aprobado y ya dejamos registrado tu pedido. A partir de aqui nos encargamos de coordinar la entrega y mantenerte al tanto.",
    afterHero:
      renderSection("Resumen", summaryCard) +
      renderSection("Detalle del pedido", orderTable) +
      shippingSection +
      renderSection(
        "Que sigue",
        `
          <div style="display:grid;gap:10px;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">1. Validamos tu pedido y alistamos la entrega.</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">2. Cuando se despache, te compartiremos la guía.</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">3. Si necesitas ayuda antes de eso, estamos disponibles.</p>
          </div>
        `,
      ),
    footerNote:
      "Si tienes dudas sobre tu pedido, puedes escribirnos y te ayudamos a resolverlo rapidamente.",
  });
};

export const emailDespacho = ({
  nombreCliente,
  orderName,
  subtitulo,
  cuerpo,
  trackingCompany,
  trackingNumber,
  trackingUrl,
}) =>
  renderLayout({
    preheader: `Tu pedido ${orderName} ya va en camino`,
    eyebrow: subtitulo || "Actualización de envío",
    title: `Hola, ${nombreCliente}`,
    body: cuerpo,
    primaryCta: trackingUrl
      ? {
          href: trackingUrl,
          label: "Rastrear pedido",
        }
      : null,
    afterHero:
      renderSection(
        "Datos de envío",
        renderInfoCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            ${renderRow("Pedido", `<strong style="font-size:16px;color:${EMAIL_COLOR_BLACK};">${escapeHtml(orderName)}</strong>`)}
            ${renderRow("Transportadora", escapeHtml(trackingCompany || "Pendiente"))}
            ${renderRow("Guia", `<strong style="font-size:16px;color:${EMAIL_COLOR_BLACK};">${escapeHtml(trackingNumber || "Pendiente")}</strong>`, { border: false })}
          </table>
        `),
      ) +
      renderSection(
        "Recordatorio",
        `<p style="margin:0;font-size:14px;line-height:1.7;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">También puedes consultar el estado del pedido desde tu cuenta en PAVOA cuando quieras.</p>`,
      ),
    footerNote:
      "Te recomendamos guardar este correo hasta que recibas tu pedido.",
  });

export const emailEntregado = ({ nombreCliente, orderName }) =>
  renderLayout({
    preheader: `Tu pedido ${orderName} fue entregado`,
    eyebrow: "Pedido entregado",
    title: `Hola, ${nombreCliente}`,
    body: `Tu pedido <strong style="color:${EMAIL_COLOR_BLACK};">${escapeHtml(orderName)}</strong> ya fue entregado. Esperamos que disfrutes mucho tu compra.`,
    afterHero:
      renderSection(
        "Pedido",
        renderInfoCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            ${renderRow("Número", `<strong style="font-size:16px;color:${EMAIL_COLOR_BLACK};">${escapeHtml(orderName)}</strong>`, { border: false })}
          </table>
        `),
      ) +
      renderSection(
        "Gracias por elegirnos",
        `<p style="margin:0;font-size:14px;line-height:1.7;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">Si necesitas soporte con tu compra o quieres gestionar un cambio, puedes escribirnos y te guiaremos.</p>`,
      ),
  });

export const emailVerificacion = ({ firstName, verifyLink }) =>
  renderLayout({
    preheader: "Verifica tu correo para activar tu cuenta PAVOA",
    eyebrow: "Bienvenida",
    title: `Hola, ${firstName}`,
    body:
      "Gracias por unirte a PAVOA. Verifica tu correo para activar tu cuenta y comenzar a gestionar tus pedidos, wishlist y beneficios.",
    primaryCta: {
      href: verifyLink,
      label: "Verificar correo",
    },
    afterHero: renderSection(
      "Seguridad",
      `<p style="margin:0;font-size:14px;line-height:1.7;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">Este enlace expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo.</p>`,
    ),
  });

export const emailResetPassword = ({ firstName, resetLink }) =>
  renderLayout({
    preheader: "Restablece tu contrasena de PAVOA",
    eyebrow: "Seguridad",
    title: `Hola, ${firstName}`,
    body:
      "Recibimos una solicitud para cambiar tu contrasena. Si fuiste tu, usa el siguiente boton para crear una nueva de forma segura.",
    primaryCta: {
      href: resetLink,
      label: "Restablecer contrasena",
    },
    afterHero: renderSection(
      "Importante",
      `<p style="margin:0;font-size:14px;line-height:1.7;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo sin problema.</p>`,
    ),
  });

