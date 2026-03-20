"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Evenement = {
  id: number
  titre: string
  categorie: string
  ville: string
  quand: string
  heure: string
  prix: string
  emoji: string
  couleur: string
  organisateur: string
  description: string
  image_url: string
}

export default function EvenementDetail() {
  const router = useRouter()
  const params = useParams()
  const [evenement, setEvenement] = useState<Evenement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvenement = async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .eq("id", params.id)
        .single()
      if (error) {
        console.error(error)
      } else {
        setEvenement(data)
      }
      setLoading(false)
    }
    fetchEvenement()
  }, [params.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-4">⏳</p>
          <p>Chargement...</p>
        </div>
      </main>
    )
  }

  if (!evenement) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-500">Événement introuvable</p>
          <button onClick={() => router.push("/")} className="mt-4 text-purple-600 font-medium">
            ← Retour à l'accueil
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-purple-600 hover:text-purple-800 font-medium text-sm">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp</h1>
      </header>

      {/* Image */}
      <div className="h-64 overflow-hidden">
        {evenement.image_url ? (
          <img src={evenement.image_url} alt={evenement.titre} className="w-full h-full object-cover"/>
        ) : (
          <div className={`${evenement.couleur} w-full h-full flex items-center justify-center text-7xl`}>
            {evenement.emoji}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
          {evenement.categorie}
        </span>

        <h2 className="text-3xl font-bold text-gray-800 mt-3 mb-2">{evenement.titre}</h2>
        <p className="text-gray-500 mb-6">{evenement.ville} • {evenement.quand}</p>

        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Date</p>
            <p className="font-medium text-gray-800">{evenement.quand}{evenement.heure ? `, ${evenement.heure}` : ""}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Lieu</p>
            <p className="font-medium text-gray-800">{evenement.ville}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Prix</p>
            <p className={`font-medium ${evenement.prix === "Gratuit" ? "text-green-600" : "text-gray-800"}`}>
              {evenement.prix}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Organisateur</p>
            <p className="font-medium text-gray-800">{evenement.organisateur}</p>
          </div>
        </div>

        {evenement.description && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-2">À propos</h3>
            <p className="text-gray-600 leading-relaxed">{evenement.description}</p>
          </div>
        )}

        <button className="w-full bg-purple-600 text-white py-4 rounded-full text-lg font-bold hover:bg-purple-700 transition-colors">
          Je participe !
        </button>
      </div>
    </main>
  )
}