import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, url }) {
  const fullTitle = title ? `${title} | PAVOA` : 'PAVOA | Tienda Deportiva Online'
  const fullUrl = `https://pavoa.vercel.app${url || ''}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
    </Helmet>
  )
}