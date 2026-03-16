"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const categories = [
  { label: "Tout", emoji: "✨" },
  { label: "Musique", emoji: "🎵" },
  { label: "Sport", emoji: "🏃" },
  { label: "Culture", emoji: "🎨" },
  { label: "Food", emoji: "🍕" },
  { label: "Nature", emoji: "🌿" },
  { label: "Gratuit", emoji: "🎁" },
]

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
}

export default function Home() {
  const router = useRouter()
  const [categorieActive, setCategorieActive] = useState("Tout")
  const [recherche, setRecherche] = useState("")
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvenements = async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
      if (error) {
        console.error(error)
      } else {
        setEvenements(data || [])
      }
      setLoading(false)
    }
    fetchEvenements()
  }, [])

  const evenementsFiltres = evenements.filter((e) => {
    const matchCategorie = categorieActive === "Tout" ||
      (categorieActive === "Gratuit" ? e.prix === "Gratuit" : e.categorie === categorieActive)
    const matchRecherche = e.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      e.ville.toLowerCase().includes(recherche.toLowerCase())
    return matchCategorie && matchRecherche
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-600">SortiesApp</h1>
          <p className="text-gray-500 text-sm">Trouve des activités près de chez toi</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/auth")} className="border border-purple-600 text-purple-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-50">
            Se connecter
          </button>
          <button onClick={() => router.push("/publier")} className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700">
            Publier un événement
          </button>
        </div>
      </header>

      <section className="bg-purple-600 py-12 px-6 text-center">
        <h2 className="text-white text-3xl font-bold mb-4">
          Que faire près de chez toi ?
        </h2>
        <input
          type="text"
          placeholder="Recherche un événement, une ville..."
          className="w-full max-w-xl px-4 py-3 rounded-full text-gray-800 shadow-md outline-none"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </section>

      <section className="px-6 py-4 bg-white border-b flex gap-3 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setCategorieActive(cat.label)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${
              categorieActive === cat.label
                ? "bg-purple-600 text-white border-purple-600"
                : "border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </section>

      <section className="px-6 py-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">⏳</p>
            <p className="text-lg">Chargement des événements...</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {evenementsFiltres.length} événement{evenementsFiltres.length > 1 ? "s" : ""} trouvé{evenementsFiltres.length > 1 ? "s" : ""}
            </h3>
            {evenementsFiltres.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-4">😕</p>
                <p className="text-lg">Aucun événement trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {evenementsFiltres.map((e) => (
                  <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className={`${e.couleur} rounded-lg h-32 mb-3 flex items-center justify-center text-4xl`}>
                      {e.emoji}
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
                      {e.categorie}
                    </span>
                    <h4 className="font-bold text-gray-800 mt-2">{e.titre}</h4>
                    <p className="text-gray-500 text-sm">{e.ville} • {e.quand}</p>
                    <p className={`font-medium text-sm mt-1 ${e.prix === "Gratuit" ? "text-green-600" : "text-gray-800"}`}>
                      {e.prix}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}