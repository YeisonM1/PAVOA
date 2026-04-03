import React from 'react';
import HeroFullscreen from '../sections/HeroFullscreen';
import Categorias from '../sections/Categorias';
import Productos from '../sections/Productos';
import Filosofia from '../sections/Filosofia';
import Instagram from '../sections/Instagram';

export default function HomePage() {
  return (
    <main>
      <HeroFullscreen />
      <Categorias />
      <Productos />
      <Filosofia />
      <Instagram />
    </main>
  );
}