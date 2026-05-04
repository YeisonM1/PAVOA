const getEnv = (key) => String(process.env[key] || '').trim();

const getMailProvider = () => (getEnv('MAIL_PROVIDER') || 'resend').toLowerCase();

const normalizeRecipients = (value) =>
  (Array.isArray(value) ? value : [value])
    .map((recipient) => String(recipient || '').trim())
    .filter(Boolean);

const parseFrom = (value) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^(.*?)<([^>]+)>$/);
  if (!match) return { email: raw, name: null };
  return {
    name: match[1].trim().replace(/^"|"$/g, '') || null,
    email: match[2].trim(),
  };
};

const buildSender = (from) => {
  const configuredName = getEnv('MAIL_FROM_NAME');
  const configuredEmail = getEnv('MAIL_FROM_EMAIL');

  if (configuredEmail) {
    return {
      email: configuredEmail,
      name: configuredName || parseFrom(from).name || null,
    };
  }

  return parseFrom(from);
};

const sendWithResend = async ({ from, to, subject, html, text }) => {
  const apiKey = getEnv('RESEND_API_KEY');
  if (!apiKey) {
    throw new Error('Falta RESEND_API_KEY para enviar correos con Resend.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: normalizeRecipients(to),
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend fallo con ${response.status}: ${errorText}`);
  }

  return response.json().catch(() => ({}));
};

const sendWithMailtrapSandbox = async ({ from, to, subject, html, text }) => {
  const apiToken = getEnv('MAILTRAP_SANDBOX_API_TOKEN');
  const inboxId = getEnv('MAILTRAP_SANDBOX_INBOX_ID');

  if (!apiToken || !inboxId) {
    throw new Error(
      'Faltan MAILTRAP_SANDBOX_API_TOKEN o MAILTRAP_SANDBOX_INBOX_ID para usar Mailtrap Sandbox.',
    );
  }

  const sender = buildSender(from);
  const response = await fetch(`https://sandbox.api.mailtrap.io/api/send/${inboxId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      from: {
        email: sender.email,
        name: sender.name || undefined,
      },
      to: normalizeRecipients(to).map((email) => ({ email })),
      subject,
      html,
      text: text || undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailtrap Sandbox fallo con ${response.status}: ${errorText}`);
  }

  return response.json().catch(() => ({}));
};

export const sendTransactionalEmail = async ({ from, to, subject, html, text }) => {
  const provider = getMailProvider();

  if (provider === 'mailtrap_sandbox') {
    return sendWithMailtrapSandbox({ from, to, subject, html, text });
  }

  return sendWithResend({ from, to, subject, html, text });
};

export const getActiveMailProvider = () => getMailProvider();
