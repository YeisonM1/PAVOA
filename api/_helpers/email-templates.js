const APP_URL = process.env.VITE_APP_URL || "https://www.pavoa.com.co";
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
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" bgcolor="${EMAIL_COLOR_BLACK}" style="border:1px solid ${EMAIL_COLOR_BLACK};">
        <a
          href="${href}"
          style="display:inline-block;min-width:232px;padding:18px 30px;color:${EMAIL_COLOR_IVORY};text-decoration:none;text-align:center;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;font-family:${EMAIL_FONT_SECONDARY};"
        >
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>
`;

const renderSectionHeading = (title) => `
  <p style="margin:0 0 16px;text-align:center;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
    ${escapeHtml(title)}
  </p>
`;

const renderInfoRows = (rows) =>
  rows
    .filter(Boolean)
    .map((row, index, allRows) => {
      const showBorder = index !== allRows.length - 1;
      return `
        <tr>
          <td style="padding:14px 0;${showBorder ? `border-bottom:1px solid ${EMAIL_COLOR_BORDER};` : ""}font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_SECONDARY};">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:14px 0;${showBorder ? `border-bottom:1px solid ${EMAIL_COLOR_BORDER};` : ""}font-size:15px;line-height:1.55;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_PRIMARY};">
            ${row.value}
          </td>
        </tr>
      `;
    })
    .join("");

const renderCard = ({ content, background = "#ffffff", padding = "22px 24px" }) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_COLOR_BORDER};background:${background};">
    <tr>
      <td style="padding:${padding};">
        ${content}
      </td>
    </tr>
  </table>
`;

const renderTextBlock = (html) => `
  <p style="margin:0;font-size:13px;line-height:1.8;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">
    ${html}
  </p>
`;

const renderHeroStatusCard = ({ title, body, badge, rows }) =>
  renderCard({
    background: "linear-gradient(180deg, rgba(246,241,234,0.92), rgba(255,253,250,0.96))",
    padding: "0",
    content: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:22px 24px 18px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 0 14px;">
                  <p style="margin:0 0 6px;font-size:28px;line-height:1.1;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};font-weight:600;">
                    ${escapeHtml(title)}
                  </p>
                  <p style="margin:0;font-size:13px;line-height:1.7;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">
                    ${body}
                  </p>
                </td>
              </tr>
              ${badge
                ? `
              <tr>
                <td>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:10px 14px;border:1px solid rgba(223,205,180,0.9);background:rgba(238,229,216,0.72);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_SECONDARY};">
                        ${escapeHtml(badge)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
                : ""}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 24px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${renderInfoRows(rows)}
            </table>
          </td>
        </tr>
      </table>
    `,
  });

const renderStepsCard = (title, steps) =>
  renderCard({
    content: `
      ${renderSectionHeading(title)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${steps
          .map(
            (step, index) => `
          <tr>
            <td style="padding:${index === 0 ? "0 0 12px" : "12px 0"};${index !== steps.length - 1 ? `border-bottom:1px solid ${EMAIL_COLOR_BORDER};` : ""}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="28" valign="top" style="padding:0 12px 0 0;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
                    ${index + 1}
                  </td>
                  <td valign="top" style="font-size:13px;line-height:1.7;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">
                    ${escapeHtml(step)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `,
          )
          .join("")}
      </table>
    `,
  });

const renderOrderItemsCard = (lineItems = []) =>
  renderCard({
    content: `
      ${renderSectionHeading("Detalle del pedido")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${(lineItems || [])
          .map((item, index) => {
            const variantLabel = formatVariantLabel(item.variant_title);
            return `
              <tr>
                <td style="padding:${index === 0 ? "0 0 14px" : "14px 0"};${index !== lineItems.length - 1 ? `border-bottom:1px solid ${EMAIL_COLOR_BORDER};` : ""}">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td valign="top" style="padding:0 14px 0 0;">
                        <table role="presentation" width="60" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_COLOR_BORDER};background:${EMAIL_COLOR_IVORY};">
                          <tr>
                            <td align="center" valign="middle" style="padding:14px 8px;">
                              <img src="${MARK_URL}" alt="" width="18" style="display:block;width:18px;height:auto;opacity:0.72;">
                              <p style="margin:8px 0 0;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
                                Prenda
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td valign="top" style="font-family:${EMAIL_FONT_PRIMARY};">
                        <p style="margin:0 0 6px;font-size:20px;line-height:1.2;color:${EMAIL_COLOR_BLACK};font-weight:600;">
                          ${escapeHtml(item.title)}
                        </p>
                        <p style="margin:0;font-size:11px;line-height:1.7;color:${EMAIL_COLOR_MUTED};letter-spacing:0.12em;text-transform:uppercase;">
                          ${variantLabel ? `${escapeHtml(variantLabel)} · ` : ""}Cantidad ${escapeHtml(item.quantity)}
                        </p>
                      </td>
                      <td valign="top" align="right" style="white-space:nowrap;font-size:14px;line-height:1.4;color:${EMAIL_COLOR_BLACK};font-weight:700;font-family:${EMAIL_FONT_PRIMARY};">
                        $${formatMoney(item.price)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            `;
          })
          .join("")}
      </table>
    `,
  });

const renderLayout = ({
  preheader,
  eyebrow,
  title,
  body,
  primaryCta,
  afterHero = "",
  footerNote = "Si necesitas ayuda, responde a este correo o escríbenos desde PAVOA.",
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_COLOR_BG};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:rgba(246,241,234,0.82);border:1px solid rgba(223,205,180,0.7);">
            <tr>
              <td style="padding:12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(238,229,216,0.9);background:#fffdfa;">
                  <tr>
                    <td align="center" style="padding:44px 24px 28px;background:${EMAIL_COLOR_IVORY};border-bottom:1px solid ${EMAIL_COLOR_BORDER};">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                        <tr>
                          <td style="vertical-align:middle;">
                            <img src="${LOGO_URL}" alt="PAVOA" width="168" style="display:block;width:168px;max-width:100%;height:auto;">
                          </td>
                          <td style="padding-left:10px;vertical-align:middle;">
                            <img src="${MARK_URL}" alt="" width="24" style="display:block;width:24px;height:auto;">
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:0.34em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
                        ${escapeHtml(eyebrow)}
                      </p>
                      <h1 style="margin:0;font-size:42px;line-height:1.08;font-weight:500;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};">
                        ${escapeHtml(title)}
                      </h1>
                      <div style="width:44px;height:1px;background:${EMAIL_COLOR_GOLD};margin:24px auto 22px;"></div>
                      <p style="margin:0 auto;max-width:420px;font-size:14px;line-height:1.85;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">
                        ${body}
                      </p>
                    </td>
                  </tr>
                  ${primaryCta
                    ? `
                  <tr>
                    <td align="center" style="padding:26px 24px 0;background:#fffdfa;">
                      ${renderButton(primaryCta.href, primaryCta.label)}
                    </td>
                  </tr>`
                    : ""}
                  ${afterHero
                    ? `
                  <tr>
                    <td style="padding:18px 24px 28px;background:#fffdfa;">
                      ${afterHero}
                    </td>
                  </tr>`
                    : ""}
                  <tr>
                    <td style="padding:24px 24px 32px;background:#fffdfa;border-top:1px solid ${EMAIL_COLOR_BORDER};">
                      <p style="margin:0;text-align:center;font-size:11px;line-height:1.8;color:${EMAIL_COLOR_MUTED};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FONT_SECONDARY};">
                        ${footerNote}
                      </p>
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
  direccion,
}) => {
  const summaryRows = [
    {
      label: "Pedido",
      value: escapeHtml(orderName),
    },
    {
      label: "Medio de pago",
      value: "Mercado Pago",
    },
    {
      label: "Total pagado",
      value: `<span style="font-size:20px;font-weight:600;font-family:${EMAIL_FONT_PRIMARY};">$${escapeHtml(total)}</span>`,
    },
  ];

  if (descuentoAplicado) {
    summaryRows.splice(2, 0, {
      label: "Descuento",
      value: `<span style="color:${EMAIL_COLOR_CHARCOAL};">Bienvenida aplicado</span>`,
    });
    summaryRows.splice(2, 0, {
      label: "Subtotal",
      value: `<span style="text-decoration:line-through;color:${EMAIL_COLOR_MUTED_SOFT};">$${escapeHtml(totalOriginal)}</span>`,
    });
  }

  const direccionCard = direccion
    ? renderCard({
        content: `
          ${renderSectionHeading("Dirección de entrega")}
          ${renderTextBlock(escapeHtml(direccion))}
        `,
      })
    : "";

  return renderLayout({
    preheader: `Pedido ${orderName} confirmado`,
    eyebrow: "Confirmación de pedido",
    title: "Tu compra quedó lista",
    body:
      "Tu pago fue aprobado y ya dejamos registrado tu pedido. Ahora nos encargamos de prepararlo y mantenerte al tanto.",
    afterHero:
      renderHeroStatusCard({
        title: "Tu pedido está confirmado",
        body: "Una lectura limpia y directa con la información principal de la compra.",
        badge: "Pago aprobado",
        rows: summaryRows,
      }) +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderOrderItemsCard(lineItems) +
      (direccionCard ? `<div style="height:18px;line-height:18px;">&nbsp;</div>${direccionCard}` : "") +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderStepsCard("Qué sigue", [
        "Confirmamos el pedido y alistamos las prendas.",
        "Cuando se despache, te compartiremos la guía.",
        "Si necesitas ayuda antes, puedes escribirnos.",
      ]),
    footerNote:
      "Si tienes dudas sobre tu pedido, puedes escribirnos y te ayudamos a resolverlo rápidamente.",
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
    title: "Tu pedido ya va en camino",
    body: cuerpo,
    afterHero:
      renderHeroStatusCard({
        title: "Tu envío fue despachado",
        body: "Aquí lo importante es ver claramente la guía, la transportadora y el acceso al rastreo.",
        badge: "En tránsito",
        rows: [
          {
            label: "Pedido",
            value: escapeHtml(orderName),
          },
          {
            label: "Transportadora",
            value: escapeHtml(trackingCompany || "Pendiente"),
          },
          {
            label: "Guía",
            value: `<span style="font-size:18px;font-weight:600;font-family:${EMAIL_FONT_PRIMARY};">${escapeHtml(trackingNumber || "Pendiente")}</span>`,
          },
        ],
      }) +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderCard({
        content: `
          ${renderSectionHeading("Seguimiento")}
          ${renderTextBlock(
            trackingUrl
              ? "Consulta la guía directamente desde el enlace de seguimiento para ver las actualizaciones de la transportadora."
              : "Cuando la transportadora habilite el rastreo, podrás consultarlo desde tu cuenta en PAVOA.",
          )}
          ${trackingUrl ? `<div style="height:18px;line-height:18px;">&nbsp;</div><div align="center">${renderButton(trackingUrl, "Rastrear pedido")}</div>` : ""}
        `,
      }),
    footerNote:
      "Te recomendamos guardar este correo hasta que recibas tu pedido.",
  });

export const emailEntregado = ({ nombreCliente, orderName }) =>
  renderLayout({
    preheader: `Tu pedido ${orderName} fue entregado`,
    eyebrow: "Pedido entregado",
    title: "Tu pedido ya llegó",
    body: `Tu pedido <strong style="color:${EMAIL_COLOR_BLACK};">${escapeHtml(orderName)}</strong> fue entregado correctamente. Esperamos que disfrutes mucho tu compra.`,
    afterHero:
      renderCard({
        background: "linear-gradient(180deg, rgba(246,241,234,0.92), rgba(255,253,250,0.96))",
        content: `
          <div align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 18px;">
              <tr>
                <td style="padding:10px 14px;border:1px solid rgba(223,205,180,0.9);background:rgba(238,229,216,0.72);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_SECONDARY};">
                  Entregado
                </td>
              </tr>
            </table>
            <p style="margin:0 0 12px;font-size:30px;line-height:1.15;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};font-weight:600;">
              Esperamos que lo disfrutes mucho
            </p>
            <p style="margin:0 auto;max-width:380px;font-size:13px;line-height:1.8;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">
              Si necesitas apoyo con tu compra, cambios o cualquier detalle posterior, seguimos disponibles para ayudarte.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px auto 0;">
              <tr>
                <td style="padding:0 10px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
                  Pedido ${escapeHtml(orderName)}
                </td>
                <td style="padding:0 10px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
                  Entrega confirmada
                </td>
              </tr>
            </table>
          </div>
        `,
      }) +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderCard({
        content: `
          ${renderSectionHeading("Seguimos aquí")}
          ${renderTextBlock("Si necesitas soporte con tu compra o quieres gestionar un cambio, puedes escribirnos y te guiaremos.")}
        `,
      }),
  });

export const emailVerificacion = ({ firstName, verifyLink }) =>
  renderLayout({
    preheader: "Verifica tu correo para activar tu cuenta PAVOA",
    eyebrow: "Bienvenida",
    title: `Hola, ${firstName}`,
    body:
      "Gracias por unirte a PAVOA. Solo necesitas verificar tu correo para activar tu cuenta y empezar a gestionar pedidos, wishlist y beneficios.",
    primaryCta: {
      href: verifyLink,
      label: "Verificar cuenta",
    },
    afterHero: renderCard({
      content: `
        ${renderSectionHeading("Importante")}
        ${renderTextBlock("Este enlace expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo.")}
      `,
    }),
  });

export const emailResetPassword = ({ firstName, resetLink }) =>
  renderLayout({
    preheader: "Restablece tu contraseña de PAVOA",
    eyebrow: "Seguridad",
    title: "Cambia tu contraseña",
    body:
      "Recibimos una solicitud para actualizar el acceso a tu cuenta. Si fuiste tú, usa el siguiente botón para crear una nueva contraseña de forma segura.",
    primaryCta: {
      href: resetLink,
      label: "Restablecer contraseña",
    },
    afterHero: renderCard({
      content: `
        ${renderSectionHeading("Enlace temporal")}
        ${renderTextBlock("Este acceso expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este mensaje y tu cuenta seguirá segura.")}
      `,
    }),
  });

export const emailContactoCliente = ({ nombre, asunto }) =>
  renderLayout({
    preheader: "Recibimos tu mensaje en PAVOA",
    eyebrow: "Confirmación de contacto",
    title: "Recibimos tu mensaje",
    body:
      "Ya recibimos tu mensaje y lo estamos revisando. Si nos escribiste por una duda, cambio o disponibilidad, te responderemos en el menor tiempo posible.",
    primaryCta: {
      href: `${APP_URL}/categoria`,
      label: "Ver colección",
    },
    afterHero:
      renderCard({
        background: "linear-gradient(180deg, rgba(246,241,234,0.92), rgba(255,253,250,0.96))",
        content: `
          <div align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 18px;">
              <tr>
                <td style="padding:10px 14px;border:1px solid rgba(223,205,180,0.9);background:rgba(238,229,216,0.72);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_SECONDARY};">
                  Mensaje recibido
                </td>
              </tr>
            </table>
            <p style="margin:0 0 12px;font-size:30px;line-height:1.15;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};font-weight:600;">
              Te responderemos pronto
            </p>
            <p style="margin:0 auto;max-width:380px;font-size:13px;line-height:1.8;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">
              Hola ${escapeHtml(nombre)}, tu mensaje ya quedó registrado y nuestro equipo lo revisará lo antes posible.
            </p>
            <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid ${EMAIL_COLOR_BORDER};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_SECONDARY};">
              Asunto: ${escapeHtml(asunto)}
            </p>
          </div>
        `,
      }) +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderCard({
        content: `
          ${renderSectionHeading("Mientras tanto")}
          ${renderTextBlock("Si quieres, puedes seguir explorando la colección mientras te respondemos.")}
        `,
      }),
    footerNote:
      "Si necesitas agregar algo más a tu consulta, puedes responder a este mismo correo.",
  });

export const emailContactoInterno = ({ nombre, contacto, asunto, mensaje }) =>
  renderLayout({
    preheader: `Nuevo mensaje de contacto: ${asunto}`,
    eyebrow: "Nuevo mensaje de contacto",
    title: "Te escribieron desde la tienda",
    body:
      "Correo operativo para revisar rápido quién escribió, desde qué contacto y cuál fue el mensaje recibido desde el formulario.",
    afterHero:
      renderCard({
        background: "linear-gradient(180deg, rgba(246,241,234,0.92), rgba(255,253,250,0.96))",
        padding: "0",
        content: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 20px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:18px 10px 18px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_SECONDARY};">
                      Nombre
                    </td>
                    <td style="padding:18px 0 18px 10px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:15px;line-height:1.55;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_PRIMARY};">
                      ${escapeHtml(nombre)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 10px 18px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_SECONDARY};">
                      Contacto
                    </td>
                    <td style="padding:18px 0 18px 10px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:15px;line-height:1.55;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_PRIMARY};">
                      ${escapeHtml(contacto)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 10px 18px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_SECONDARY};">
                      Asunto
                    </td>
                    <td style="padding:18px 0 18px 10px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:15px;line-height:1.55;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_PRIMARY};">
                      ${escapeHtml(asunto)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 10px 18px 0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_SECONDARY};">
                      Mensaje
                    </td>
                    <td style="padding:18px 0 18px 10px;font-size:15px;line-height:1.75;color:${EMAIL_COLOR_BLACK};text-align:left;vertical-align:top;font-family:${EMAIL_FONT_PRIMARY};white-space:pre-line;">
                      ${escapeHtml(mensaje)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `,
      }) +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderCard({
        content: `
          ${renderSectionHeading("Base operativa")}
          ${renderTextBlock("Diseñado para responder rápido sin perder la línea visual general de PAVOA.")}
        `,
      }),
    footerNote:
      "Mensaje recibido desde el formulario de contacto de PAVOA.",
  });
