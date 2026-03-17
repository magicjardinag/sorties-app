"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAIL = "a.giraudon@astem.fr"

type Evenement = {
  id: number
  titre: string
  categorie: string
  ville: string
  quand: string
  prix: string
  emoji: string
  organisateur: string
  statut: string
}

export default function Admin() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState("en_attente")

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/")
        return
      }
      fetchEvenements()
    }
    checkAdmin()
  }, [])

  const fetchEvenements = async () => {
    const { data } = await supabase
      .from("evenements")
      .select("*")
      .order("titre", { ascending: true })
    setEvenements(data || [])
    setLoading(false)
  }

  const handleStatut = async (id: number, statut: string, organisateur: string, titre: string) => {
  await fetch("/api/moderation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, statut, organisateur, titre })
  })
  await fetchEvenements()
    setEvenements(evenements.map((e) => e.id === id ? { ...e, statut } : e))
  }

  const handleDelete = async (id: number) => {
    await supabase.from("evenements").delete().eq("id", id)
    setEvenements(evenements.filter((e) => e.id !== id))
  }

  const evenementsFiltres = evenements.filter((e) => filtre === "tous" || e.statut === filtre)

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-purple-600">SortiesApp — Admin</h1>
          <p className="text-gray-500 text-sm">Panneau de modération</p>
        </div>
        <button onClick={() => router.push("/")} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">
          ← Retour au site
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{evenements.filter(e => e.statut === "en_attente").length}</p>
            <p className="text-gray-500 text-sm">En attente</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{evenements.filter(e => e.statut === "approuve").length}</p>
            <p className="text-gray-500 text-sm">Approuvés</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{evenements.filter(e => e.statut === "refuse").length}</p>
            <p className="text-gray-500 text-sm">Refusés</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          {["en_attente", "approuve", "refuse", "tous"].map((s) => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtre === s ? "bg-purple-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "en_attente" ? "En attente" : s === "approuve" ? "Approuvés" : s === "refuse" ? "Refusés" : "Tous"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">⏳</p>
            <p>Chargement...</p>
          </div>
        ) : evenementsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow text-gray-400">
            <p className="text-4xl mb-4">📭</p>
            <p>Aucun événement dans cette catégorie</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {evenementsFiltres.map((e) => (
              <div key={e.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{e.emoji}</div>
                    <div>
                      <h3 className="font-bold text-gray-800">{e.titre}</h3>
                      <p className="text-gray-500 text-sm">{e.ville} • {e.quand} • {e.prix}</p>
                      <p className="text-gray-400 text-xs">Par {e.organisateur}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${
                        e.statut === "approuve" ? "bg-green-100 text-green-600" :
                        e.statut === "refuse" ? "bg-red-100 text-red-600" :
                        "bg-amber-100 text-amber-600"
                      }`}>
                        {e.statut === "en_attente" ? "En attente" : e.statut === "approuve" ? "Approuvé" : "Refusé"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {e.statut !== "approuve" && (
                      <button onClick={() => handleStatut(e.id, "approuve", e.organisateur, e.titre)} className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600">
                        ✓ Approuver
                      </button>
                    )}
                    {e.statut !== "refuse" && (
                      <button onClick={() => handleStatut(e.id, "refuse", e.organisateur, e.titre)} className="bg-amber-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-amber-600">
                        ✗ Refuser
                      </button>
                    )}
                    <button onClick={() => handleDelete(e.id)} className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}