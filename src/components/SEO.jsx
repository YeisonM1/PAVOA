import { Helmet } from 'react-helmet-async'

const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=630&q=80&fm=jpg&fit=crop'

export default function SEO({ title, description, url, image, type = 'website', jsonLd }) {
  const fullTitle = title ? `${title} | PAVOA` : 'PAVOA | Tienda Deportiva Online'
  const fullUrl = `https://pavoa.vercel.app${url || ''}`
  const ogImage = image || DEFAULT_OG_IMAGE

  const ldItems = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean)
    : []

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="PAVOA" />
      <meta property="og:locale" content="es_CO" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {ldItems.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  )
}