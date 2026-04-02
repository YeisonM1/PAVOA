const posts = [
  { id: 1, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80' },
  { id: 2, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' },
  { id: 3, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80' },
  { id: 4, image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80' },
  { id: 5, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80' },
  { id: 6, image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80' },
];

const InstagramIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="white" stroke="none"/>
  </svg>
);

export default function Instagram() {
  return (
    <section className="w-full bg-white py-20">

      {/* Título */}
      <div className="text-center mb-10 px-6">
        <p
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.3em' }}
          className="text-[10px] font-medium text-stone-400 mb-3"
        >
          SÍGUENOS EN INSTAGRAM
        </p>
        <h2
          style={{ fontFamily: 'Montserrat, sans-serif' }}
          className="text-2xl md:text-3xl font-light text-stone-900 tracking-widest"
        >
          @PAVOA
        </h2>
      </div>

      {/* Grid sin espacios */}
      <div className="grid grid-cols-3 md:grid-cols-6">
        {posts.map((post) => (
          <a
            key={post.id}
            href="https://instagram.com/pavoa"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden"
            style={{ aspectRatio: '1/1' }}
          >
            <img
              src={post.image}
              alt="PAVOA Instagram"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay con ícono */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-400 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75 group-hover:scale-100 transform">
                <InstagramIcon />
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Link al perfil */}
      <div className="text-center mt-10">
        <a
          href="https://instagram.com/pavoa"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2em' }}
          className="inline-block text-[11px] font-medium text-stone-500 hover:text-stone-900 transition-colors border-b border-stone-300 pb-0.5"
        >
          VER PERFIL
        </a>
      </div>

    </section>
  );
}