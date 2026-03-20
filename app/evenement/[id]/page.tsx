"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Evenement = {
  id: string
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
  const [showAffiche, setShowAffiche] = useState(false)

  useEffect(() => {
    const fetchEvenement = async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .eq("id", params.id)
        .single()
      if (error) { console.error(error) } else { setEvenement(data) }
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

      {/* Hero image pleine largeur */}
      <div className="relative h-96 w-full overflow-hidden">
        {evenement.image_url ? (
          <img src={evenement.image_url} alt={evenement.titre} className="w-full h-full object-cover"/>
        ) : (
          <div className={`${evenement.couleur} w-full h-full flex items-center justify-center text-8xl`}>
            {evenement.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
        <button
          onClick={() => router.back()}
          className="absolute top-5 left-5 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
        >
          ← Retour
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full mb-3 inline-block">
            {evenement.categorie}
          </span>
          <h1 className="text-4xl font-bold text-white mb-2">{evenement.titre}</h1>
          <p className="text-white/80 text-lg">{evenement.ville} · {evenement.quand}</p>
        </div>
      </div>

      {/* Lightbox affiche */}
      {showAffiche && (
        <div
          onClick={() => setShowAffiche(false)}
          onMouseLeave={() => setShowAffiche(false)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        >
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">✕</button>
          <img
            src={evenement.image_url}
            alt={evenement.titre}
            className="max-h-screen max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Contenu */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 grid grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Date</p>
            <p className="font-semibold text-gray-900">{evenement.quand}{evenement.heure ? `, ${evenement.heure}` : ""}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Lieu</p>
            <p className="font-semibold text-gray-900">{evenement.ville}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Prix</p>
            <p className={`font-semibold text-lg ${evenement.prix === "Gratuit" ? "text-green-500" : "text-gray-900"}`}>
              {evenement.prix}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Organisateur</p>
            <p className="font-semibold text-gray-900">{evenement.organisateur}</p>
          </div>
        </div>

        {evenement.description && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3">À propos</h3>
            <p className="text-gray-600 leading-relaxed">{evenement.description}</p>
          </div>
        )}

        <button className="w-full bg-purple-600 text-white py-4 rounded-2xl text-lg font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
          Je participe ! 🎉
        </button>

        {/* Miniature affiche */}
        {evenement.image_url && (
          <div className="mt-8">
            <p className="text-gray-400 text-sm mb-3">🖼️ Affiche de l'événement</p>
            <div
              onClick={() => setShowAffiche(true)}
              onMouseEnter={() => setShowAffiche(true)}
              className="relative w-32 cursor-pointer group"
            >
              <img
                src={evenement.image_url}
                alt="affiche"
                className="w-32 h-44 object-cover rounded-xl shadow-md group-hover:shadow-xl group-hover:scale-150 group-hover:-translate-y-8 transition-all duration-300 origin-bottom-left"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}