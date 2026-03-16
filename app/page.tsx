import Image from "next/image";
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6">
        <h1 className="text-2xl font-bold text-purple-600">SortiesApp</h1>
        <p className="text-gray-500 text-sm">Trouve des activités près de chez toi</p>
      </header>

      {/* Barre de recherche */}
      <section className="bg-purple-600 py-12 px-6 text-center">
        <h2 className="text-white text-3xl font-bold mb-4">
          Que faire près de chez toi ?
        </h2>
        <input
          type="text"
          placeholder="Recherche un événement, une ville..."
          className="w-full max-w-xl px-4 py-3 rounded-full text-gray-800 shadow-md outline-none"
        />
      </section>

      {/* Événements */}
      <section className="px-6 py-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Événements à la une</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Carte événement */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="bg-purple-100 rounded-lg h-32 mb-3 flex items-center justify-center text-purple-400 text-4xl">🎵</div>
            <h4 className="font-bold text-gray-800">Concert Jazz</h4>
            <p className="text-gray-500 text-sm">Paris • Ce soir • Gratuit</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="bg-orange-100 rounded-lg h-32 mb-3 flex items-center justify-center text-orange-400 text-4xl">🎨</div>
            <h4 className="font-bold text-gray-800">Expo Photo</h4>
            <p className="text-gray-500 text-sm">Lyon • Demain • 5€</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="bg-green-100 rounded-lg h-32 mb-3 flex items-center justify-center text-green-400 text-4xl">🏃</div>
            <h4 className="font-bold text-gray-800">Course urbaine</h4>
            <p className="text-gray-500 text-sm">Bordeaux • Samedi • 10€</p>
          </div>
        </div>
      </section>
    </main>
  )
}
