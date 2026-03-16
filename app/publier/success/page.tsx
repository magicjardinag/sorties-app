"use client"

import { useRouter } from "next/navigation"

export default function Success() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-6">🎉</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Paiement réussi !
        </h1>
        <p className="text-gray-500 mb-8">
          Ton événement a bien été publié sur SortiesApp. Il sera visible par tous les utilisateurs dans quelques instants.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors"
        >
          Voir les événements
        </button>
      </div>
    </main>
  )
}