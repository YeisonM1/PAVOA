import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Importamos el Header y Footer (los globales)
import Header from './sections/Header';
import Footer from './sections/Footer';

// Importamos nuestras dos páginas
import HomePage from './pages/HomePage';
import CategoriaPage from './pages/CategoriaPage';

// ── COMPONENTE MÁGICO PARA EL SCROLL ──
// Este componente "escucha" cada vez que la URL cambia y sube la pantalla automáticamente
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      {/* Colocamos el ScrollToTop dentro del Router pero fuera de las Rutas */}
      <ScrollToTop />
      
      <div className="min-h-screen bg-white font-sans flex flex-col">
        
        {/* El Header siempre visible arriba */}
        <Header />
        
        {/* Aquí es donde ocurre la magia de React Router */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/categoria" element={<CategoriaPage />} />
          </Routes>
        </div>

        {/* El Footer siempre visible abajo */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;