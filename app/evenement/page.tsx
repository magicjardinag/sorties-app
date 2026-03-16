"use client"

import { useRouter } from "next/navigation"

export default function Evenement() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp</h1>
      </header>

      {/* Image */}
      <div className="bg-purple-100 h-48 flex items-center justify-center text-7xl">
        🎵
      </div>

      {/* Contenu */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
          Musique
        </span>

        <h2 className="text-3xl font-bold text-gray-800 mt-3 mb-2">
          Concert Jazz
        </h2>

        <p className="text-gray-500 mb-6">
          Paris • Ce soir
        </p>

        {/* Infos */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Date</p>
            <p className="font-medium text-gray-800">Ce soir, 20h00</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Lieu</p>
            <p className="font-medium text-gray-800">Paris, 75001</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Prix</p>
            <p className="font-medium text-green-600">Gratuit</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Organisateur</p>
            <p className="font-medium text-gray-800">Jazz Club Paris</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-2">À propos</h3>
          <p className="text-gray-600 leading-relaxed">
            Une soirée jazz exceptionnelle au cœur de Paris. Venez découvrir 
            les meilleurs musiciens de jazz de la scène parisienne dans une 
            ambiance chaleureuse et conviviale. Entrée libre, consommation obligatoire.
          </p>
        </div>

        {/* Bouton */}
        <button className="w-full bg-purple-600 text-white py-4 rounded-full text-lg font-bold hover:bg-purple-700 transition-colors">
          Je participe !
        </button>
      </div>
    </main>
  )
}