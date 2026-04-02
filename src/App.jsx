import { Rocket, CheckCircle, Palette, Zap } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl shadow-xl p-10 max-w-md w-full text-center">

        <Rocket className="mx-auto text-indigo-400 mb-4" size={56} />
        <h1 className="text-3xl font-bold text-white mb-2">¡Todo funciona!</h1>
        <p className="text-gray-400 mb-8">Tu stack está listo para desarrollar.</p>

        <div className="space-y-4 text-left">

          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
            <Zap className="text-yellow-400" size={22} />
            <span className="text-white font-medium">React + Vite</span>
            <CheckCircle className="text-green-400 ml-auto" size={20} />
          </div>

          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
            <Palette className="text-sky-400" size={22} />
            <span className="text-white font-medium">Tailwind CSS</span>
            <CheckCircle className="text-green-400 ml-auto" size={20} />
          </div>

          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
            <Rocket className="text-indigo-400" size={22} />
            <span className="text-white font-medium">Lucide React</span>
            <CheckCircle className="text-green-400 ml-auto" size={20} />
          </div>

        </div>
      </div>
    </div>
  )
}

export default App