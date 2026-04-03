import Header from './sections/Header'
import HeroSplit from './sections/HeroSplit'
import HeroFullscreen from './sections/HeroFullscreen'
import Ticker from './sections/Ticker'
import Categorias from './sections/Categorias'
import Productos from './sections/Productos'
import Filosofia from './sections/Filosofia'
import BannerSecundario from './sections/BannerSecundario'
import Instagram from './sections/Instagram'
import Footer from './sections/Footer'


function App() {
  return (
    <div className="min-h-screen bg-white font-sans">

      <Header />
      {/*<HeroSplit /> */}
      <HeroFullscreen />
      {/* <Ticker /> */}
      <Categorias />
      <Productos />
      <Filosofia />
      {/* <BannerSecundario /> */}
      <Instagram />
      <Footer />

    </div>
  )
}

export default App