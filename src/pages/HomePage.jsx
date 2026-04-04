import React from 'react';
import HeroFullscreen from '../sections/HeroFullscreen';
import Categorias from '../sections/Categorias';
import Productos from '../sections/Productos';
import Filosofia from '../sections/Filosofia';
import Instagram from '../sections/Instagram';
import SEO from '../components/SEO';

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
        <Categorias />
        <Productos />
        <Filosofia />
        <Instagram />
      </main>
    </>
  );
}