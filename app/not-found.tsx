"use client"

import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🗺️</div>
        <h1 className="text-6xl font-bold text-purple-600 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page introuvable</h2>
        <p className="text-gray-500 mb-8">
          On dirait que cette sortie n'existe pas... ou plus ! Retourne à l'accueil pour découvrir des événements près de chez toi.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl text-lg font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
          >
            🏠 Retour à l'accueil
          </button>
          <button
            onClick={() => router.push("/carte")}
            className="w-full border border-purple-300 text-purple-600 py-4 rounded-2xl text-lg font-bold hover:bg-purple-50 transition-colors"
          >
            🗺️ Voir la carte
          </button>
          <button
            onClick={() => router.back()}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
          >
            ← Page précédente
          </button>
        </div>
      </div>
    </main>
  )
}