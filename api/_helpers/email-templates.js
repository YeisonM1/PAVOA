const APP_URL = process.env.VITE_APP_URL || "https://pavoa.vercel.app";
const LOGO_URL = `${APP_URL}/logo-pavoa.png`;

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
    style="display:inline-block;background-color:#111111;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:14px 24px;border-radius:999px;">
    ${escapeHtml(label)}
  </a>
`;

const renderRow = (label, value, options = {}) => `
  <tr>
    <td style="padding:${options.padding || "12px 0"};${options.border === false ? "" : "border-bottom:1px solid #eee7dd;"}font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8175;width:38%;vertical-align:top;">
      ${escapeHtml(label)}
    </td>
    <td style="padding:${options.padding || "12px 0"};${options.border === false ? "" : "border-bottom:1px solid #eee7dd;"}font-size:14px;line-height:1.6;color:#161616;text-align:right;vertical-align:top;">
      ${value}
    </td>
  </tr>
`;

const renderSection = (title, content) => `
  <tr>
    <td style="padding:28px 40px 0;">
      <div style="border-top:1px solid #eee7dd;padding-top:24px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6f665b;">
          ${escapeHtml(title)}
        </p>
        ${content}
      </div>
    </td>
  </tr>
`;

const renderInfoCard = (content) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee7dd;background-color:#faf7f2;border-radius:16px;">
    <tr>
      <td style="padding:20px 22px;">
        ${content}
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
    <title>PAVOA</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#161616;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      ${escapeHtml(preheader || "")}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1ea;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e9e2d8;">
            <tr>
              <td align="center" style="padding:28px 32px 24px;border-bottom:1px solid #eee7dd;">
                <img src="${LOGO_URL}" alt="PAVOA" width="118" style="display:block;height:auto;max-height:48px;object-fit:contain;">
              </td>
            </tr>

            <tr>
              <td style="padding:36px 40px 8px;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#8a8175;">
                  ${escapeHtml(eyebrow)}
                </p>
                <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;font-weight:600;color:#161616;">
                  ${escapeHtml(title)}
                </h1>
                <div style="width:36px;height:2px;background-color:#dbc7ae;margin:0 0 20px;"></div>
                <p style="margin:0;font-size:15px;line-height:1.8;color:#4f4a44;">
                  ${body}
                </p>
              </td>
            </tr>

            ${primaryCta ? `
            <tr>
              <td style="padding:28px 40px 0;">
                ${renderButton(primaryCta.href, primaryCta.label)}
              </td>
            </tr>` : ""}

            ${afterHero}

            <tr>
              <td style="padding:32px 40px 40px;">
                <div style="border-top:1px solid #eee7dd;padding-top:24px;">
                  <p style="margin:0;font-size:12px;line-height:1.7;color:#7b746b;">
                    ${footerNote}
                  </p>
                  <p style="margin:18px 0 0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#b4aca2;">
                    PAVOA
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

export const emailConfirmacion = ({
  firstName,
  orderName,
  paymentId,
  lineItems,
  total,
  totalOriginal,
  descuentoAplicado,
  direccion,
}) => {
  const itemsHtml = (lineItems || [])
    .map((item) => {
      const variantLabel = formatVariantLabel(item.variant_title);

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #eee7dd;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#161616;">
              ${escapeHtml(item.title)}
            </p>
            ${variantLabel ? `
              <p style="margin:5px 0 0;font-size:12px;color:#7b746b;">
                ${escapeHtml(variantLabel)}
              </p>` : ""}
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #eee7dd;text-align:center;font-size:13px;color:#5d5852;">
            x ${item.quantity}
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #eee7dd;text-align:right;font-size:14px;font-weight:600;color:#161616;">
            $${formatMoney(item.price)}
          </td>
        </tr>
      `;
    })
    .join("");

  const summaryCard = renderInfoCard(`
    <table width="100%" cellpadding="0" cellspacing="0">
      ${renderRow("Pedido", `<strong style="font-size:16px;color:#161616;">${escapeHtml(orderName)}</strong>`)}
      ${renderRow("Pago", `MP #${escapeHtml(paymentId)}`)}
      ${descuentoAplicado
        ? renderRow("Subtotal", `<span style="text-decoration:line-through;color:#8a8175;">$${escapeHtml(totalOriginal)}</span>`)
        : ""}
      ${descuentoAplicado
        ? renderRow("Beneficio", `<span style="color:#9b8158;font-weight:600;">Descuento bienvenida aplicado</span>`)
        : ""}
      ${renderRow("Total pagado", `<strong style="font-size:18px;color:#161616;">$${escapeHtml(total)}</strong>`, { border: false })}
    </table>
  `);

  const orderTable = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:10px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8175;">Producto</td>
        <td style="padding-bottom:10px;text-align:center;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8175;">Cant.</td>
        <td style="padding-bottom:10px;text-align:right;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8175;">Valor</td>
      </tr>
      ${itemsHtml}
    </table>
  `;

  const shippingSection = direccion
    ? renderSection(
        "Direccion de entrega",
        `<p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">${escapeHtml(direccion)}</p>`,
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
            <p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">2. Cuando se despache, te compartiremos la guia.</p>
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
    eyebrow: subtitulo || "Actualizacion de envio",
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
        "Datos de envio",
        renderInfoCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            ${renderRow("Pedido", `<strong style="font-size:16px;color:#161616;">${escapeHtml(orderName)}</strong>`)}
            ${renderRow("Transportadora", escapeHtml(trackingCompany || "Pendiente"))}
            ${renderRow("Guia", `<strong style="font-size:16px;color:#161616;">${escapeHtml(trackingNumber || "Pendiente")}</strong>`, { border: false })}
          </table>
        `),
      ) +
      renderSection(
        "Recordatorio",
        `<p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">Tambien puedes consultar el estado del pedido desde tu cuenta en PAVOA cuando quieras.</p>`,
      ),
    footerNote:
      "Te recomendamos guardar este correo hasta que recibas tu pedido.",
  });

export const emailEntregado = ({ nombreCliente, orderName }) =>
  renderLayout({
    preheader: `Tu pedido ${orderName} fue entregado`,
    eyebrow: "Pedido entregado",
    title: `Hola, ${nombreCliente}`,
    body: `Tu pedido <strong style="color:#161616;">${escapeHtml(orderName)}</strong> ya fue entregado. Esperamos que disfrutes mucho tu compra.`,
    afterHero:
      renderSection(
        "Pedido",
        renderInfoCard(`
          <table width="100%" cellpadding="0" cellspacing="0">
            ${renderRow("Numero", `<strong style="font-size:16px;color:#161616;">${escapeHtml(orderName)}</strong>`, { border: false })}
          </table>
        `),
      ) +
      renderSection(
        "Gracias por elegirnos",
        `<p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">Si necesitas soporte con tu compra o quieres gestionar un cambio, puedes escribirnos y te guiaremos.</p>`,
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
      `<p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">Este enlace expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo.</p>`,
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
      `<p style="margin:0;font-size:14px;line-height:1.7;color:#4f4a44;">Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo sin problema.</p>`,
    ),
  });
