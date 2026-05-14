// Genera public/sitemap.xml con productos reales de Shopify
// Se ejecuta antes del build: "node scripts/generate-sitemap.mjs"

const BASE_URL = 'https://pavoa.vercel.app';
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN || 'pavoa-4502.myshopify.com';
const SHOPIFY_TOKEN = process.env.VITE_SHOPIFY_TOKEN || '05266ab33c7181b5a7b09ca287c80c59';

const STATIC_URLS = [
  { loc: '/',          priority: '1.0', changefreq: 'weekly'  },
  { loc: '/categoria', priority: '0.9', changefreq: 'weekly'  },
  { loc: '/nosotros',  priority: '0.7', changefreq: 'monthly' },
  { loc: '/contacto',  priority: '0.6', changefreq: 'monthly' },
  { loc: '/ayuda/envios',              priority: '0.5', changefreq: 'monthly' },
  { loc: '/ayuda/cambios-devoluciones',priority: '0.5', changefreq: 'monthly' },
  { loc: '/ayuda/pagos',               priority: '0.5', changefreq: 'monthly' },
];

async function fetchAllProducts() {
  const products = [];
  let cursor = null;
  let hasNext = true;

  while (hasNext) {
    const afterClause = cursor ? `, after: "${cursor}"` : '';
    const query = `{
      products(first: 100${afterClause}) {
        pageInfo { hasNextPage endCursor }
        edges { node { handle updatedAt } }
      }
    }`;

    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN },
      body: JSON.stringify({ query }),
    });

    const { data } = await res.json();
    const page = data.products;
    products.push(...page.edges.map(e => e.node));
    hasNext = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return products;
}

const products = await fetchAllProducts();
console.log(`Productos encontrados: ${products.length}`);

const today = new Date().toISOString().split('T')[0];

const urls = [
  ...STATIC_URLS.map(u => `
  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`),
  ...products.map(p => `
  <url>
    <loc>${BASE_URL}/producto/${p.handle}</loc>
    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

import { writeFileSync } from 'fs';
writeFileSync('public/sitemap.xml', xml);
console.log(`sitemap.xml generado con ${STATIC_URLS.length + products.length} URLs`);
