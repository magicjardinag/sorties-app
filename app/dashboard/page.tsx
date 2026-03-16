"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Evenement = {
  id: number
  titre: string
  categorie: string
  ville: string
  quand: string
  prix: string
  emoji: string
}

export default function Dashboard() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }
      setUser(user)

      const { data } = await supabase
        .from("evenements")
        .select("*")
        .eq("user_id", user.id)

      setEvenements(data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleDelete = async (id: number) => {
    await supabase.from("evenements").delete().eq("id", id)
    setEvenements(evenements.filter((e) => e.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-purple-600">SortiesApp</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/")} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">
            ← Accueil
          </button>
          <button onClick={handleLogout} className="border border-red-200 text-red-500 px-4 py-2 rounded-full text-sm font-medium hover:bg-red-50">
            Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Mes événements</h2>
          <button onClick={() => router.push("/publier")} className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700">
            + Publier un événement
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">⏳</p>
            <p>Chargement...</p>
          </div>
        ) : evenements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-500 mb-4">Tu n'as pas encore publié d'événement</p>
            <button onClick={() => router.push("/publier")} className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700">
              Publier mon premier événement
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {evenements.map((e) => (
              <div key={e.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{e.emoji}</div>
                  <div>
                    <h3 className="font-bold text-gray-800">{e.titre}</h3>
                    <p className="text-gray-500 text-sm">{e.ville} • {e.quand} • {e.prix}</p>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">{e.categorie}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/evenement/${e.id}`)} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                    Voir
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="border border-red-200 text-red-500 px-3 py-2 rounded-lg text-sm hover:bg-red-50">
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}