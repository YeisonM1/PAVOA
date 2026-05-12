import React, { Suspense, lazy } from 'react';
import HeroFullscreen from '../sections/HeroFullscreen';
import SEO from '../components/SEO';

// â”€â”€ Carga diferida â€” no bloquean el Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Categorias = lazy(() => import('../sections/Categorias'));
const Productos  = lazy(() => import('../sections/Productos'));
const Filosofia  = lazy(() => import('../sections/Filosofia'));
const Instagram  = lazy(() => import('../sections/Instagram'));

export default function HomePage() {
  return (
    <>
      <SEO
        title="Ropa Deportiva Femenina Premium"
        description="PAVOA crea ropa deportiva femenina premium para entrenamiento, movimiento diario y estilo. Piezas de edición limitada con envíos a toda Colombia."
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

