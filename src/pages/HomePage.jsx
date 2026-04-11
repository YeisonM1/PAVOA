import React, { Suspense, lazy } from 'react';
import HeroFullscreen from '../sections/HeroFullscreen';
import SEO from '../components/SEO';

// ── Carga diferida — no bloquean el Hero ──────────────
const Categorias = lazy(() => import('../sections/Categorias'));
const Productos  = lazy(() => import('../sections/Productos'));
const Filosofia  = lazy(() => import('../sections/Filosofia'));
const Instagram  = lazy(() => import('../sections/Instagram'));

export default function HomePage() {
  return (
    <>
      <SEO
        title="Tienda Deportiva Online"
        description="Encuentra ropa, calzado y accesorios deportivos. Running, fútbol, gym y más. Envíos a toda Colombia."
        url="/"
      />
      <main>
        <HeroFullscreen />
        <Suspense fallback={<div className="min-h-screen" />}>
          <Categorias />
          <Productos />
          <Filosofia />
          <Instagram />
        </Suspense>
      </main>
    </>
  );
}