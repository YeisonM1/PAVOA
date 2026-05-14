import React, { Suspense, lazy } from 'react';
import HeroFullscreen from '../sections/HeroFullscreen';
import Categorias from '../sections/Categorias';
import SEO from '../components/SEO';

// Solo lazy las secciones pesadas o below-the-fold profundo
const Productos = lazy(() => import('../sections/Productos'));
const Filosofia = lazy(() => import('../sections/Filosofia'));
const Instagram = lazy(() => import('../sections/Instagram'));

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
        <Categorias />
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Productos />
        </Suspense>
        <Suspense fallback={<div className="min-h-[80vh]" />}>
          <Filosofia />
        </Suspense>
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          <Instagram />
        </Suspense>
      </main>
    </>
  );
}
