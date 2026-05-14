#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getShopifyToken } from '../api/_helpers/shopify-token.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const API_VERSION = '2026-04';
const DEFAULT_TAGS = ['pavoa-web', 'mercadopago'];
const VALID_RESOURCES = new Set(['drafts', 'orders']);
const VALID_ACTIONS = new Set(['list', 'delete', 'cancel']);

const loadEnvFile = (filePath, { override = false } = {}) => {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key) continue;
    if (!override && process.env[key]) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

const requestedEnvFileArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith('--env-file='));

loadEnvFile(path.join(REPO_ROOT, '.env'));
loadEnvFile(path.join(REPO_ROOT, '.env.local'));

if (requestedEnvFileArg) {
  const requestedPath = requestedEnvFileArg.slice('--env-file='.length).trim();
  const resolvedPath = path.isAbsolute(requestedPath)
    ? requestedPath
    : path.resolve(REPO_ROOT, requestedPath);
  loadEnvFile(resolvedPath, { override: true });
}

const SHOPIFY_DOMAIN = String(process.env.VITE_SHOPIFY_DOMAIN || '').trim();

const usage = `
Uso:
  node scripts/cleanup-shopify.mjs --resource=drafts [--action=list|delete] [--apply]
  node scripts/cleanup-shopify.mjs --resource=orders [--action=list|delete|cancel] [--apply]

Opciones:
  --resource=TYPE            drafts | orders
  --action=TYPE              list | delete | cancel
  --apply                    Ejecuta la accion. Sin esto, siempre es dry-run.
  --older-than-minutes=NUM   Solo toca registros mas viejos que NUM minutos. Default: 60
  --status=VALUE             Drafts: open | invoice_sent | completed | any. Orders: open | closed | cancelled | any
  --max-pages=NUM            Maximo de paginas a leer. Default: 10
  --page-size=NUM            Registros por pagina. Default: 100, max: 250
  --env-file=PATH            Carga variables desde un archivo .env adicional.
  --tag=VALUE                Tag requerido. Repite la bandera para varios tags.
  --no-default-tags          No exigir pavoa-web y mercadopago.
  --id=VALUE                 Limita a un id especifico. Repite la bandera para varios ids.
  --help                     Muestra esta ayuda.

Ejemplos:
  node scripts/cleanup-shopify.mjs --resource=drafts
  node scripts/cleanup-shopify.mjs --resource=drafts --action=delete --older-than-minutes=180 --apply
  node scripts/cleanup-shopify.mjs --resource=drafts --env-file=.env.vercel
  node scripts/cleanup-shopify.mjs --resource=orders --status=any --tag=pavoa-web --tag=mercadopago
  node scripts/cleanup-shopify.mjs --resource=orders --action=delete --id=123456789 --apply

Notas:
  - Drafts abiertos de PAVOA suelen tener tags pavoa-web y mercadopago.
  - Shopify documenta que los orders que interactuaron con un online gateway no siempre se pueden borrar.
  - La accion cancel para orders debe usarse solo en pedidos de prueba.
`.trim();

const exitWithUsage = (message, code = 1) => {
  if (message) {
    console.error(`\n${message}\n`);
  }
  console.log(usage);
  process.exit(code);
};

const parsePositiveInt = (value, label) => {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    exitWithUsage(`${label} debe ser un entero positivo.`);
  }
  return parsed;
};

const parseArgs = (argv) => {
  const config = {
    resource: 'drafts',
    action: 'list',
    apply: false,
    olderThanMinutes: 60,
    status: null,
    maxPages: 10,
    pageSize: 100,
    tags: [...DEFAULT_TAGS],
    ids: [],
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      exitWithUsage('', 0);
    }
    if (arg === '--apply') {
      config.apply = true;
      continue;
    }
    if (arg === '--no-default-tags') {
      config.tags = [];
      continue;
    }
    if (arg.startsWith('--env-file=')) {
      continue;
    }
    if (arg.startsWith('--resource=')) {
      config.resource = arg.slice('--resource='.length).trim();
      continue;
    }
    if (arg.startsWith('--action=')) {
      config.action = arg.slice('--action='.length).trim();
      continue;
    }
    if (arg.startsWith('--older-than-minutes=')) {
      config.olderThanMinutes = parsePositiveInt(arg.slice('--older-than-minutes='.length), 'older-than-minutes');
      continue;
    }
    if (arg.startsWith('--status=')) {
      config.status = arg.slice('--status='.length).trim();
      continue;
    }
    if (arg.startsWith('--max-pages=')) {
      config.maxPages = parsePositiveInt(arg.slice('--max-pages='.length), 'max-pages');
      continue;
    }
    if (arg.startsWith('--page-size=')) {
      config.pageSize = parsePositiveInt(arg.slice('--page-size='.length), 'page-size');
      continue;
    }
    if (arg.startsWith('--tag=')) {
      const tag = arg.slice('--tag='.length).trim();
      if (tag) config.tags.push(tag);
      continue;
    }
    if (arg.startsWith('--id=')) {
      const id = arg.slice('--id='.length).trim();
      if (id) config.ids.push(id);
      continue;
    }

    exitWithUsage(`Argumento no reconocido: ${arg}`);
  }

  if (!VALID_RESOURCES.has(config.resource)) {
    exitWithUsage(`resource invalido: ${config.resource}`);
  }
  if (!VALID_ACTIONS.has(config.action)) {
    exitWithUsage(`action invalida: ${config.action}`);
  }
  if (config.resource === 'drafts' && config.action === 'cancel') {
    exitWithUsage('La accion cancel solo aplica a orders.');
  }
  if (config.resource === 'orders' && !config.status) {
    config.status = 'any';
  }
  if (config.resource === 'drafts' && !config.status) {
    config.status = 'open';
  }
  if (config.pageSize > 250) {
    exitWithUsage('page-size no puede ser mayor a 250.');
  }

  return config;
};

const config = parseArgs(process.argv.slice(2));

if (!SHOPIFY_DOMAIN) {
  console.error('Falta VITE_SHOPIFY_DOMAIN en el entorno o en .env.');
  process.exit(1);
}

const getTokenPreferences = (resource) =>
  resource === 'orders' ? ['admin', 'app'] : ['app', 'admin'];

const parseLinkHeader = (value = '') => {
  const match = String(value).match(/<([^>]+)>;\s*rel="next"/i);
  return match?.[1] || null;
};

const toIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toAgeMinutes = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / 60_000);
};

const parseTags = (value) =>
  String(value || '')
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

const matchesTags = (recordTags, requiredTags) => {
  if (!requiredTags.length) return true;
  const haystack = new Set(parseTags(recordTags));
  return requiredTags.every((tag) => haystack.has(String(tag).trim().toLowerCase()));
};

const hasMatchingId = (recordId, ids) => {
  if (!ids.length) return true;
  return ids.includes(String(recordId));
};

const getRecordAgeBase = (record) =>
  record.updated_at || record.created_at || record.processed_at || null;

const matchesFilters = (record, resource, currentConfig) => {
  if (!hasMatchingId(record.id, currentConfig.ids)) return false;
  if (!matchesTags(record.tags, currentConfig.tags)) return false;

  const ageBase = getRecordAgeBase(record);
  const ageMinutes = toAgeMinutes(ageBase);
  if (ageMinutes === null || ageMinutes < currentConfig.olderThanMinutes) return false;

  if (resource === 'drafts' && record.order_id) return false;

  return true;
};

const getCollectionMeta = (resource) =>
  resource === 'drafts'
    ? {
        endpoint: 'draft_orders',
        dataKey: 'draft_orders',
        fields: [
          'id',
          'name',
          'order_id',
          'status',
          'created_at',
          'updated_at',
          'invoice_sent_at',
          'tags',
          'total_price',
        ],
      }
    : {
        endpoint: 'orders',
        dataKey: 'orders',
        fields: [
          'id',
          'name',
          'created_at',
          'updated_at',
          'processed_at',
          'cancelled_at',
          'closed_at',
          'financial_status',
          'fulfillment_status',
          'payment_gateway_names',
          'tags',
          'test',
          'total_price',
        ],
      };

const buildListUrl = (resource, currentConfig) => {
  const { endpoint, fields } = getCollectionMeta(resource);
  const url = new URL(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/${endpoint}.json`);
  url.searchParams.set('limit', String(currentConfig.pageSize));
  url.searchParams.set('fields', fields.join(','));

  if (resource === 'drafts') {
    url.searchParams.set('status', currentConfig.status || 'open');
  } else {
    url.searchParams.set('status', currentConfig.status || 'any');
  }

  return url.toString();
};

const shopifyFetch = async (resource, url, init = {}) => {
  let lastError = null;

  for (const preferred of getTokenPreferences(resource)) {
    try {
      const token = await getShopifyToken(preferred);
      const res = await fetch(url, {
        ...init,
        headers: {
          ...(init.headers || {}),
          'X-Shopify-Access-Token': token,
        },
      });

      if (preferred === 'admin' && resource === 'drafts' && res.ok) {
        console.warn('[cleanup-shopify] Draft cleanup usando fallback con SHOPIFY_ADMIN_TOKEN.');
      }
      if (preferred === 'app' && resource === 'orders' && res.ok) {
        console.warn('[cleanup-shopify] Order cleanup usando fallback con token app de Shopify.');
      }

      if (res.status === 401 || res.status === 403) {
        console.warn(`[cleanup-shopify] Shopify respondio ${res.status} usando token ${preferred}.`);
        lastError = new Error(`Shopify respondio ${res.status} usando token ${preferred}.`);
        continue;
      }

      return res;
    } catch (error) {
      console.warn(`[cleanup-shopify] Fallo consultando Shopify con token ${preferred}: ${error.message}`);
      lastError = error;
    }
  }

  throw lastError || new Error('No se pudo autenticar contra Shopify.');
};

const fetchCandidates = async (resource, currentConfig) => {
  const { dataKey } = getCollectionMeta(resource);
  const candidates = [];
  let url = buildListUrl(resource, currentConfig);
  let page = 0;

  while (url && page < currentConfig.maxPages) {
    page += 1;
    const res = await shopifyFetch(resource, url);
    const raw = await res.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(`Respuesta invalida de Shopify: ${raw.slice(0, 300)}`);
    }

    if (!res.ok) {
      throw new Error(`Shopify ${res.status}: ${raw.slice(0, 400)}`);
    }

    const records = Array.isArray(data?.[dataKey]) ? data[dataKey] : [];
    for (const record of records) {
      if (matchesFilters(record, resource, currentConfig)) {
        candidates.push(record);
      }
    }

    url = parseLinkHeader(res.headers.get('link'));
  }

  return candidates;
};

const summarizeDraft = (draft) => ({
  id: String(draft.id),
  name: draft.name || '(sin nombre)',
  status: draft.status || 'unknown',
  ageMinutes: toAgeMinutes(getRecordAgeBase(draft)),
  total: draft.total_price || '',
  createdAt: toIso(draft.created_at),
  updatedAt: toIso(draft.updated_at),
  tags: draft.tags || '',
});

const summarizeOrder = (order) => ({
  id: String(order.id),
  name: order.name || '(sin nombre)',
  ageMinutes: toAgeMinutes(getRecordAgeBase(order)),
  total: order.total_price || '',
  financialStatus: order.financial_status || '',
  fulfillmentStatus: order.fulfillment_status || '',
  cancelledAt: toIso(order.cancelled_at),
  gateways: Array.isArray(order.payment_gateway_names) ? order.payment_gateway_names.join('|') : '',
  test: Boolean(order.test),
  createdAt: toIso(order.created_at),
  updatedAt: toIso(order.updated_at),
  tags: order.tags || '',
});

const printTable = (resource, records) => {
  const summaries = resource === 'drafts'
    ? records.map(summarizeDraft)
    : records.map(summarizeOrder);

  if (!summaries.length) {
    console.log('No se encontraron candidatos con los filtros actuales.');
    return;
  }

  console.table(summaries);
};

const deleteDraft = async (draftId) => {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/draft_orders/${draftId}.json`;
  const res = await shopifyFetch('drafts', url, { method: 'DELETE' });
  const body = await res.text();

  if (res.ok || res.status === 404) {
    return { ok: true, status: res.status, body };
  }

  return { ok: false, status: res.status, body };
};

const deleteOrder = async (orderId) => {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/orders/${orderId}.json`;
  const res = await shopifyFetch('orders', url, { method: 'DELETE' });
  const body = await res.text();

  if (res.ok || res.status === 404) {
    return { ok: true, status: res.status, body };
  }

  return { ok: false, status: res.status, body };
};

const cancelOrder = async (orderId) => {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/orders/${orderId}/cancel.json`;
  const res = await shopifyFetch('orders', url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const body = await res.text();

  if (res.ok) {
    return { ok: true, status: res.status, body };
  }

  return { ok: false, status: res.status, body };
};

const runAction = async (resource, action, records, apply) => {
  if (action === 'list') {
    return { success: records.length, failed: 0 };
  }

  const executor = resource === 'drafts'
    ? deleteDraft
    : action === 'delete'
      ? deleteOrder
      : cancelOrder;

  let success = 0;
  let failed = 0;

  for (const record of records) {
    const label = `${record.name || '#?'} (${record.id})`;
    if (!apply) {
      console.log(`[dry-run] ${action} -> ${label}`);
      success += 1;
      continue;
    }

    const result = await executor(record.id);
    if (result.ok) {
      console.log(`[ok] ${action} -> ${label}`);
      success += 1;
      continue;
    }

    console.error(`[error] ${action} -> ${label}: Shopify ${result.status} ${result.body}`);
    failed += 1;
  }

  return { success, failed };
};

const main = async () => {
  console.log(`Shopify cleanup :: resource=${config.resource} action=${config.action} apply=${config.apply ? 'yes' : 'no'}`);
  console.log(`Filtros :: olderThanMinutes=${config.olderThanMinutes} status=${config.status} tags=${config.tags.join(',') || '(sin tags)'}`);

  if (config.resource === 'orders' && config.action === 'delete') {
    console.warn('Aviso: Shopify documenta que orders con online gateway pueden no ser eliminables.');
  }
  if (config.resource === 'orders' && config.action === 'cancel') {
    console.warn('Aviso: cancel debe usarse solo para pedidos de prueba.');
  }

  const records = await fetchCandidates(config.resource, config);
  console.log(`Candidatos encontrados: ${records.length}`);
  printTable(config.resource, records);

  if (!records.length) {
    return;
  }

  const { success, failed } = await runAction(config.resource, config.action, records, config.apply);
  if (config.action !== 'list') {
    console.log(`Resultado :: success=${success} failed=${failed} mode=${config.apply ? 'apply' : 'dry-run'}`);
  }
};

main().catch((error) => {
  console.error('[cleanup-shopify] Error fatal:', error.message);
  process.exit(1);
});
