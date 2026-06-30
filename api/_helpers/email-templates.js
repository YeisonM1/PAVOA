const APP_URL = (process.env.VITE_APP_URL || "https://www.pavoa.com.co").replace(/\/$/, "");
const EMAIL_ASSET_URL = APP_URL.replace("https://pavoa.com.co", "https://www.pavoa.com.co");
const EMAIL_ASSET_VERSION = "20260601";
const MARK_URL = `${EMAIL_ASSET_URL}/pavoa-mark.png?v=${EMAIL_ASSET_VERSION}`;
const LOGO_URL = `${EMAIL_ASSET_URL}/logo-pavoa.png?v=${EMAIL_ASSET_VERSION}`;
const SUPPORT_EMAIL = process.env.MAIL_REPLY_TO_EMAIL || "pavoacol@gmail.com";
const EMAIL_FONT_LINK = "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap";
const EMAIL_FONT_TITLE = "'Raleway', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const EMAIL_FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const EMAIL_FONT_UI = "'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const EMAIL_COLOR_BG = "#F2E4E1";
const EMAIL_COLOR_IVORY = "#F6F1EA";
const EMAIL_COLOR_GOLD = "#DFCDB4";
const EMAIL_COLOR_GOLD_SOFT = "#EEE5D8";
const EMAIL_COLOR_BORDER = "#E0D8CE";
const EMAIL_COLOR_COFFEE = "#6F4E37";
const EMAIL_COLOR_COFFEE_SOFT = "#A7856D";
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

const formatCustomerName = (value, fallback = "Cliente") => {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  if (!normalized) return fallback;

  return normalized
    .split(" ")
    .map((part) => {
      const lower = part.toLocaleLowerCase("es-CO");
      return lower.charAt(0).toLocaleUpperCase("es-CO") + lower.slice(1);
    })
    .join(" ");
};

const formatMoney = (value) => {
  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value || "").replace(/[^\d.-]/g, ""));
  return (Number.isFinite(numeric) ? numeric : 0).toLocaleString("es-CO");
};

const formatVariantLabel = (value) => {
  const normalized = String(value || "").trim();
  return normalized && normalized !== "Default Title" ? normalized : "";
};

const splitEmailListItems = (value) =>
  String(value || "")
    .split(/[\r\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const getLineItemPropertyValue = (item, propertyNames = []) => {
  const normalizedNames = new Set(
    (Array.isArray(propertyNames) ? propertyNames : [propertyNames])
      .map((name) => String(name || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const collections = [item?.properties, item?.custom_attributes];
  for (const collection of collections) {
    if (!Array.isArray(collection)) continue;
    for (const entry of collection) {
      const entryName = String(entry?.name || entry?.key || entry?.title || "").trim().toLowerCase();
      if (!normalizedNames.has(entryName)) continue;
      const entryValue = String(entry?.value || "").trim();
      if (entryValue) return entryValue;
    }
  }

  return "";
};

const getLineItemImageUrl = (item) =>
  String(
    item?.imagen ||
      item?.image ||
      item?.image_url ||
      item?.imageUrl ||
      item?.featured_image?.url ||
      item?.featured_image?.src ||
      item?.picture_url ||
      "",
  ).trim();

const getLineItemDesignDetails = (item) => {
  const rawValue =
    item?.detalles ||
    item?.details ||
    getLineItemPropertyValue(item, [
      "detalles del diseño",
      "detalles del diseno",
      "detalles",
      "design details",
    ]);

  return splitEmailListItems(rawValue);
};

const renderButton = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-button-table">
    <tr>
      <td align="center" bgcolor="${EMAIL_COLOR_BLACK}" class="email-button-cell" style="border:1px solid ${EMAIL_COLOR_BLACK};">
        <a
          href="${href}"
          class="email-button-link"
          style="display:inline-block;min-width:232px;padding:18px 30px;color:${EMAIL_COLOR_IVORY};text-decoration:none;text-align:center;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;font-family:${EMAIL_FONT_UI};"
        >
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>
`;

const renderSectionHeading = (title) => `
  <p style="margin:0 0 16px;text-align:center;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_UI};">
    ${escapeHtml(title)}
  </p>
`;

const renderInfoRows = (
  rows,
  {
    labelAlign = "left",
    valueAlign = "right",
    labelPadding = "14px 0",
    valuePadding = "14px 0",
  } = {},
) =>
  rows
    .filter(Boolean)
    .map((row, index, allRows) => {
      const showBorder = index !== allRows.length - 1;
      return `
        <tr>
          <td style="padding:${labelPadding};${showBorder ? `border-bottom:1px solid ${EMAIL_COLOR_BORDER};` : ""}font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;text-align:${labelAlign};font-family:${EMAIL_FONT_UI};">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:${valuePadding};${showBorder ? `border-bottom:1px solid ${EMAIL_COLOR_BORDER};` : ""}font-size:15px;line-height:1.6;color:${EMAIL_COLOR_BLACK};text-align:${valueAlign};vertical-align:top;font-family:${EMAIL_FONT_BODY};">
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
  <p style="margin:0;font-size:14px;line-height:1.85;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_BODY};">
    ${html}
  </p>
`;

const normalizeSupportCopy = (value) => {
  const text = String(value || "");
  if (/responde|responder/i.test(text)) {
    return `Si necesitas ayuda, escríbenos a ${SUPPORT_EMAIL}.`;
  }
  return text;
};

const renderHeroStatusCard = ({
  title,
  body,
  badge,
  rows,
  centered = false,
  rowsCentered = centered,
}) =>
  renderCard({
    background: "linear-gradient(180deg, rgba(246,241,234,0.92), rgba(255,253,250,0.96))",
    padding: "0",
    content: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:22px 24px 18px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};text-align:${centered ? "center" : "left"};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 0 14px;">
                  <p class="email-section-title" style="margin:0${body ? " 0 6px" : ""};font-size:28px;line-height:1.1;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_TITLE};font-weight:500;">
                    ${escapeHtml(title)}
                  </p>
                  ${body
                    ? `<p style="margin:0;font-size:14px;line-height:1.8;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_BODY};">
                    ${body}
                  </p>`
                    : ""}
                </td>
              </tr>
              ${badge
                ? `
              <tr>
                <td>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${centered ? "margin:0 auto;" : ""}">
                    <tr>
                      <td style="padding:10px 14px;border:1px solid rgba(223,205,180,0.9);background:rgba(238,229,216,0.72);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_UI};">
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
              ${renderInfoRows(
                rows,
                rowsCentered
                  ? { labelAlign: "center", valueAlign: "center" }
                  : {
                      labelAlign: "left",
                      valueAlign: "right",
                      labelPadding: "14px 12px 14px 0",
                      valuePadding: "14px 0 14px 12px",
                    },
              )}
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
                  <td width="28" valign="top" style="padding:0 12px 0 0;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_UI};">
                    ${index + 1}
                  </td>
                  <td valign="top" style="font-size:14px;line-height:1.8;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_BODY};">
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

const renderOrderItemsCard = (lineItems = [], { total } = {}) =>
  renderCard({
    content: `
      ${renderSectionHeading("Detalle del pedido")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${(lineItems || [])
          .map((item, index) => {
            const variantLabel = formatVariantLabel(item.variant_title || item.talla);
            const itemImageUrl = getLineItemImageUrl(item);
            const designDetails = getLineItemDesignDetails(item);
            return `
              <tr>
                <td style="padding:${index === 0 ? "0 0 14px" : "14px 0"};${index !== lineItems.length - 1 ? `border-bottom:1px solid ${EMAIL_COLOR_BORDER};` : ""}">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td valign="top" style="padding:0 14px 0 0;">
                        ${itemImageUrl
                          ? `<img src="${escapeHtml(itemImageUrl)}" alt="${escapeHtml(item.title || "Prenda PAVOA")}" width="72" style="display:block;width:72px;height:96px;object-fit:cover;border:1px solid ${EMAIL_COLOR_BORDER};background:${EMAIL_COLOR_IVORY};">`
                          : `<table role="presentation" width="60" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_COLOR_BORDER};background:${EMAIL_COLOR_IVORY};">
                          <tr>
                            <td align="center" valign="middle" style="padding:14px 8px;">
                              <img src="${MARK_URL}" alt="" width="18" style="display:block;width:18px;height:auto;opacity:0.72;">
                              <p style="margin:8px 0 0;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_UI};">
                                Prenda
                              </p>
                            </td>
                          </tr>
                        </table>`}
                      </td>
                      <td valign="top" style="font-family:${EMAIL_FONT_BODY};">
                        <p style="margin:0 0 6px;font-size:18px;line-height:1.25;color:${EMAIL_COLOR_BLACK};font-weight:600;font-family:${EMAIL_FONT_TITLE};">
                          ${escapeHtml(item.title)}
                        </p>
                        <p style="margin:0;font-size:11px;line-height:1.75;color:${EMAIL_COLOR_MUTED};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FONT_UI};">
                          ${variantLabel ? `${escapeHtml(variantLabel)} · ` : ""}Cantidad ${escapeHtml(item.quantity)}
                        </p>
                        ${designDetails.length > 0
                          ? `<div style="margin-top:12px;">
                          <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_UI};">
                            Detalles del diseño
                          </p>
                          <ul style="margin:0;padding-left:18px;color:${EMAIL_COLOR_CHARCOAL};font-size:13px;line-height:1.8;font-family:${EMAIL_FONT_BODY};">
                            ${designDetails
                              .map(
                                (detail) => `
                              <li style="margin:0 0 4px;">
                                ${escapeHtml(detail)}
                              </li>`,
                              )
                              .join("")}
                          </ul>
                        </div>`
                          : ""}
                      </td>
                      <td valign="top" align="right" style="white-space:nowrap;font-size:14px;line-height:1.4;color:${EMAIL_COLOR_BLACK};font-weight:700;font-family:${EMAIL_FONT_BODY};">
                        $${formatMoney(item.price || item.precio)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            `;
          })
          .join("")}
      </table>
      ${total != null ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${EMAIL_COLOR_BORDER};margin-top:4px;">
          <tr>
            <td style="padding:14px 0 0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_UI};">
              Total pagado
            </td>
            <td style="padding:14px 0 0;font-size:18px;font-weight:600;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_TITLE};">
              $${escapeHtml(String(total))}
            </td>
          </tr>
        </table>
      ` : ''}
    `,
  });

const renderLayout = ({
  preheader,
  eyebrow,
  title,
  body,
  primaryCta,
  afterHero = "",
  footerNote = `Si necesitas ayuda, escríbenos a ${SUPPORT_EMAIL}.`,
}) => `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <link href="${EMAIL_FONT_LINK}" rel="stylesheet">
    <title>PAVOA</title>
    <style>
      @media only screen and (max-width: 640px) {
        .email-outer-pad {
          padding: 18px 8px !important;
        }
        .email-shell-pad {
          padding: 8px !important;
        }
        .email-hero {
          padding: 34px 20px 24px !important;
        }
        .email-logo {
          width: 138px !important;
        }
        .email-wordmark {
          font-size: 30px !important;
          letter-spacing: 0.16em !important;
        }
        .email-mark {
          width: 20px !important;
        }
        .email-eyebrow {
          letter-spacing: 0.28em !important;
        }
        .email-title {
          font-size: 34px !important;
          line-height: 1.06 !important;
        }
        .email-body {
          max-width: 100% !important;
          font-size: 15px !important;
          line-height: 1.8 !important;
        }
        .email-content {
          padding: 14px 16px 22px !important;
        }
        .email-section-title {
          font-size: 24px !important;
          line-height: 1.12 !important;
        }
        .email-button-link {
          min-width: 0 !important;
          display: block !important;
          padding: 16px 14px !important;
          letter-spacing: 0.18em !important;
        }
        .email-button-table {
          width: 100% !important;
        }
        .email-button-cell {
          display: block !important;
        }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:${EMAIL_COLOR_BG};font-family:${EMAIL_FONT_BODY};color:${EMAIL_COLOR_BLACK};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      ${escapeHtml(preheader || "")}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_COLOR_BG};">
      <tr>
        <td align="center" class="email-outer-pad" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:rgba(246,241,234,0.88);border:2px solid ${EMAIL_COLOR_COFFEE};box-shadow:0 18px 44px rgba(111,78,55,0.18);">
            <tr>
              <td class="email-shell-pad" style="padding:12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_COLOR_COFFEE_SOFT};background:#fffdfa;">
                  <tr>
                    <td align="center" class="email-hero" style="padding:44px 24px 28px;background:${EMAIL_COLOR_IVORY};border-bottom:1px solid ${EMAIL_COLOR_BORDER};">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                        <tr>
                          <td style="vertical-align:middle;">
                            <img src="${LOGO_URL}" alt="PAVOA" width="138" class="email-logo" style="display:block;width:138px;height:auto;">
                          </td>
                          <td style="padding-left:14px;vertical-align:middle;">
                            <img src="${MARK_URL}" alt="" width="28" class="email-mark" style="display:block;width:28px;height:auto;">
                          </td>
                        </tr>
                      </table>
                      <p class="email-eyebrow" style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:0.34em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_UI};">
                        ${escapeHtml(eyebrow)}
                      </p>
                      <h1 class="email-title" style="margin:0;font-size:42px;line-height:1.08;font-weight:500;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_TITLE};">
                        ${escapeHtml(title)}
                      </h1>
                      <div style="width:44px;height:1px;background:${EMAIL_COLOR_GOLD};margin:24px auto 22px;"></div>
                      <p class="email-body" style="margin:0 auto;max-width:420px;font-size:14px;line-height:1.85;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_BODY};">
                        ${body}
                      </p>
                    </td>
                  </tr>
                  ${primaryCta
                    ? `
                  <tr>
                    <td align="center" class="email-content" style="padding:26px 24px 0;background:#fffdfa;">
                      ${renderButton(primaryCta.href, primaryCta.label)}
                    </td>
                  </tr>`
                    : ""}
                  ${afterHero
                    ? `
                  <tr>
                    <td class="email-content" style="padding:18px 24px 28px;background:#fffdfa;">
                      ${afterHero}
                    </td>
                  </tr>`
                    : ""}
                  <tr>
                    <td class="email-content" style="padding:24px 24px 32px;background:#fffdfa;border-top:1px solid ${EMAIL_COLOR_BORDER};">
                      <p style="margin:0;text-align:center;font-size:11px;line-height:1.8;color:${EMAIL_COLOR_MUTED};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FONT_UI};">
                        ${normalizeSupportCopy(footerNote)}
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
  tipoPago = 'mercadopago',
  envio = null,
}) => {
  const esCod = tipoPago === 'contraentrega';

  const summaryRows = [
    {
      label: "Pedido",
      value: escapeHtml(orderName),
    },
    {
      label: "Medio de pago",
      value: esCod ? "Pago contra entrega" : "Mercado Pago",
    },
    {
      label: esCod ? "Total a pagar" : "Total pagado",
      value: `<span style="font-size:20px;font-weight:600;font-family:${EMAIL_FONT_TITLE};">$${escapeHtml(total)}</span>`,
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

  if (envio) {
    summaryRows.splice(summaryRows.length - 1, 0, {
      label: "Envío",
      value: `$${escapeHtml(envio)}`,
    });
  }

  const direccionCard = direccion
    ? renderCard({
        content: `
          ${renderSectionHeading("Dirección de entrega")}
          <div style="text-align:center;">
            ${renderTextBlock(escapeHtml(direccion))}
          </div>
        `,
      })
    : "";

  return renderLayout({
    preheader: esCod ? `Pedido ${orderName} registrado` : `Pedido ${orderName} confirmado`,
    eyebrow: "Confirmación de pedido",
    title: esCod ? "Tu pedido está registrado" : "Tu compra quedó lista",
    body: esCod
      ? "Ya quedó registrado tu pedido. Nos encargamos de prepararlo y al momento de la entrega realizas el pago al mensajero."
      : "Tu pago fue aprobado y ya dejamos registrado tu pedido. Ahora nos encargamos de prepararlo y mantenerte al tanto.",
    afterHero:
      renderHeroStatusCard({
        title: esCod ? "Pedido confirmado" : "Tu pedido está confirmado",
        badge: esCod ? "Pago al recibir" : "Pago aprobado",
        rows: summaryRows,
        centered: true,
        rowsCentered: false,
      }) +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderOrderItemsCard(lineItems, { total }) +
      (direccionCard ? `<div style="height:18px;line-height:18px;">&nbsp;</div>${direccionCard}` : "") +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderStepsCard("Qué sigue", esCod ? [
        "Confirmamos el pedido y alistamos las prendas.",
        "Cuando se despache, te compartiremos la guía de rastreo.",
        "Al momento de la entrega, realizas el pago al mensajero.",
        `Si necesitas ayuda, puedes escribirnos al correo ${SUPPORT_EMAIL}.`,
      ] : [
        "Confirmamos el pedido y alistamos las prendas.",
        "Cuando se despache, te compartiremos la guía.",
        `Si necesitas ayuda antes, puedes escribirnos al correo ${SUPPORT_EMAIL}.`,
      ]),
    footerNote:
      `Si tienes dudas sobre tu pedido, puedes escribirnos a ${SUPPORT_EMAIL} y te ayudamos a resolverlo rápidamente.`,
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
            value: `<span style="font-size:18px;font-weight:600;font-family:${EMAIL_FONT_TITLE};">${escapeHtml(trackingNumber || "Pendiente")}</span>`,
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
      `Te recomendamos guardar este correo hasta que recibas tu pedido. Si necesitas ayuda, escríbenos a ${SUPPORT_EMAIL}.`,
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
                <td style="padding:10px 14px;border:1px solid rgba(223,205,180,0.9);background:rgba(238,229,216,0.72);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_UI};">
                  Entregado
                </td>
              </tr>
            </table>
            <p class="email-section-title" style="margin:0 0 12px;font-size:30px;line-height:1.15;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_TITLE};font-weight:500;">
              Esperamos que lo disfrutes mucho
            </p>
            <p style="margin:0 auto;max-width:380px;font-size:14px;line-height:1.85;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_BODY};">
              Si necesitas apoyo con tu compra, cambios o cualquier detalle posterior, seguimos disponibles para ayudarte.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px auto 0;">
              <tr>
                <td style="padding:0 10px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_UI};">
                  Pedido ${escapeHtml(orderName)}
                </td>
                <td style="padding:0 10px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_UI};">
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
          ${renderTextBlock(`Si necesitas soporte con tu compra o quieres gestionar un cambio, puedes escribirnos a ${SUPPORT_EMAIL} y te guiaremos.`)}
        `,
      }),
  });

export const emailPedidoCancelado = ({
  nombreCliente,
  orderName,
  lineItems = [],
  total,
  cancelReason,
  refundStatus,
}) => {
  const reasonLabel = String(cancelReason || '').trim();
  const refundCopyByStatus = {
    refunded: 'El reembolso ya quedó registrado. El tiempo final para verlo reflejado puede depender del medio de pago o de la entidad bancaria.',
    partially_refunded: `Este pedido tiene un reembolso parcial registrado. Si necesitas claridad sobre el valor, escríbenos a ${SUPPORT_EMAIL} y te ayudamos.`,
    paid: 'Como este pedido tenía pago aprobado, revisaremos el movimiento correspondiente y te compartiremos cualquier actualización necesaria.',
    pending: 'Este pedido no figura como pagado completamente. Por eso no debería requerir un reembolso final.',
    voided: 'El pago fue anulado correctamente antes de completarse.',
  };
  const refundCopy = refundCopyByStatus[String(refundStatus || '').trim().toLowerCase()]
    || 'Si aplica algún movimiento de dinero, te acompañaremos con la información correspondiente.';

  const rows = [
    {
      label: 'Pedido',
      value: escapeHtml(orderName),
    },
    {
      label: 'Estado',
      value: `<span style="font-weight:700;color:${EMAIL_COLOR_BLACK};">Cancelado</span>`,
    },
    total
      ? {
          label: 'Total',
          value: `<span style="font-size:20px;font-weight:600;font-family:${EMAIL_FONT_TITLE};">$${escapeHtml(total)}</span>`,
        }
      : null,
    reasonLabel
      ? {
          label: 'Motivo',
          value: escapeHtml(reasonLabel),
        }
      : null,
  ].filter(Boolean);

  return renderLayout({
    preheader: `Tu pedido ${orderName} fue cancelado`,
    eyebrow: 'Actualización de pedido',
    title: 'Pedido cancelado',
    body: `Hola ${escapeHtml(formatCustomerName(nombreCliente))}, tu pedido <strong style="color:${EMAIL_COLOR_BLACK};">${escapeHtml(orderName)}</strong> fue cancelado correctamente. Te dejamos el resumen para que tengas claridad sobre el estado de la compra.`,
    primaryCta: {
      href: `${APP_URL}/contacto?pedido=${encodeURIComponent(orderName)}`,
      label: 'Contactar soporte',
    },
    afterHero:
      renderHeroStatusCard({
        title: 'Cancelación registrada',
        body: 'Este es el estado actualizado del pedido y de la gestión asociada al pago.',
        badge: 'Pedido cancelado',
        rows,
      }) +
      (lineItems?.length
        ? `<div style="height:18px;line-height:18px;">&nbsp;</div>${renderOrderItemsCard(lineItems)}`
        : '') +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderCard({
        content: `
          ${renderSectionHeading('Sobre el pago')}
          ${renderTextBlock(escapeHtml(refundCopy))}
        `,
      }) +
      `<div style="height:18px;line-height:18px;">&nbsp;</div>` +
      renderStepsCard('Qué sigue', [
        `Si tienes dudas sobre la cancelación, escríbenos a ${SUPPORT_EMAIL} o contáctanos desde la tienda.`,
        'Si el pedido tenía pago aprobado, te compartiremos cualquier actualización necesaria sobre el movimiento.',
        'Puedes volver a la tienda cuando quieras para realizar una nueva compra.',
      ]),
    footerNote:
      `Este correo confirma la cancelación del pedido. Si necesitas ayuda, escríbenos a ${SUPPORT_EMAIL}.`,
  });
};

export const emailVerificacion = ({ firstName, verifyLink }) =>
  renderLayout({
    preheader: "Verifica tu correo para activar tu cuenta PAVOA",
    eyebrow: "Verifica tu correo",
    title: `Hola, ${formatCustomerName(firstName)}`,
    body:
      "Gracias por unirte a PAVOA. Solo necesitas verificar tu correo para activar tu cuenta y empezar a gestionar tus compras, wishlist y beneficios.",
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
                <td style="padding:10px 14px;border:1px solid rgba(223,205,180,0.9);background:rgba(238,229,216,0.72);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_UI};">
                  Mensaje recibido
                </td>
              </tr>
            </table>
            <p class="email-section-title" style="margin:0 0 12px;font-size:30px;line-height:1.15;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_TITLE};font-weight:500;">
              Te responderemos pronto
            </p>
            <p style="margin:0 auto;max-width:380px;font-size:14px;line-height:1.85;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_BODY};">
              Hola ${escapeHtml(formatCustomerName(nombre))}, tu mensaje ya quedó registrado y nuestro equipo lo revisará lo antes posible.
            </p>
            <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid ${EMAIL_COLOR_BORDER};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};font-family:${EMAIL_FONT_UI};">
              Asunto: ${escapeHtml(asunto)}
            </p>
          </div>
        `,
      }),
    footerNote:
      `Si necesitas agregar algo más a tu consulta, escríbenos a ${SUPPORT_EMAIL}.`,
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
                    <td style="padding:18px 10px 18px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_UI};">
                      Nombre
                    </td>
                    <td style="padding:18px 0 18px 10px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:15px;line-height:1.6;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_BODY};">
                      ${escapeHtml(nombre)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 10px 18px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_UI};">
                      Contacto
                    </td>
                    <td style="padding:18px 0 18px 10px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:15px;line-height:1.6;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_BODY};">
                      ${escapeHtml(contacto)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 10px 18px 0;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_UI};">
                      Asunto
                    </td>
                    <td style="padding:18px 0 18px 10px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:15px;line-height:1.6;color:${EMAIL_COLOR_BLACK};text-align:right;vertical-align:top;font-family:${EMAIL_FONT_BODY};">
                      ${escapeHtml(asunto)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 10px 18px 0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED_SOFT};vertical-align:top;font-family:${EMAIL_FONT_UI};">
                      Mensaje
                    </td>
                    <td style="padding:18px 0 18px 10px;font-size:15px;line-height:1.8;color:${EMAIL_COLOR_BLACK};text-align:left;vertical-align:top;font-family:${EMAIL_FONT_BODY};white-space:pre-line;">
                      ${escapeHtml(mensaje)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `,
      }),
    footerNote:
      "Mensaje recibido desde el formulario de contacto de PAVOA.",
  });
