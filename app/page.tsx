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
  lat: number
  lng: number
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const today = new Date()
  const eventDate = new Date(dateStr)
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "passé"
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Demain"
  if (diffDays <= 6) {
    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    return jours[new Date(dateStr).getDay()]
  }
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
}

export default function Home() {
  const router = useRouter()
  const [categorieActive, setCategorieActive] = useState("Tout")
  const [recherche, setRecherche] = useState("")
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [pubs, setPubs] = useState<any[]>([])
  const [pubIndex, setPubIndex] = useState(0)
  const [showPub, setShowPub] = useState(true)
  const [favoris, setFavoris] = useState<string[]>([])
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null)
  const [rayon, setRayon] = useState(50)
  const [filtreProximite, setFiltreProximite] = useState(false)
  const [loadingGeo, setLoadingGeo] = useState(false)

  useEffect(() => {
    const fetchEvenements = async () => {
      const { data, error } = await supabase.from("evenements").select("*").eq("statut", "approuve")
      if (error) { console.error(error) } else { setEvenements(data || []) }
      setLoading(false)
    }
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from("favoris").select("evenement_id").eq("user_id", user.id)
        setFavoris(data?.map((f: any) => f.evenement_id) || [])
      }
    }
    const fetchPubs = async () => {
      const { data } = await supabase.from("publicites").select("*").eq("actif", true)
      setPubs(data || [])
    }
    fetchEvenements()
    fetchUser()
    fetchPubs()
  }, [])

  useEffect(() => {
    if (pubsFiltrees.length === 0) return
    const interval = setInterval(() => {
      setPubIndex((prev) => (prev + 1) % pubsFiltrees.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [pubs, position])

  const activerGeolocalisation = () => {
    setLoadingGeo(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setFiltreProximite(true)
        setLoadingGeo(false)
      },
      () => {
        alert("Impossible d'accéder à ta position. Vérifie les permissions.")
        setLoadingGeo(false)
      }
    )
  }

  const desactiverGeolocalisation = () => {
    setFiltreProximite(false)
    setPosition(null)
  }

  const toggleFavori = async (e: React.MouseEvent, evenementId: string) => {
    e.stopPropagation()
    if (!user) { router.push("/auth"); return }
    const isFavori = favoris.includes(evenementId)
    if (isFavori) {
      await supabase.from("favoris").delete().eq("user_id", user.id).eq("evenement_id", evenementId)
      setFavoris(favoris.filter((id) => id !== evenementId))
    } else {
      await supabase.from("favoris").insert({ user_id: user.id, evenement_id: evenementId })
      setFavoris([...favoris, evenementId])
    }
  }

  const pubsFiltrees = position
    ? pubs.filter((pub) =>
        !pub.lat || !pub.lng ||
        getDistance(position.lat, position.lng, pub.lat, pub.lng) <= (pub.rayon || 50)
      )
    : pubs

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const evenementsFiltres = evenements.filter((e) => {
    const matchCategorie = categorieActive === "Tout" ||
      (categorieActive === "Gratuit" ? e.prix === "Gratuit" : e.categorie === categorieActive)
    const matchRecherche = e.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      e.ville.toLowerCase().includes(recherche.toLowerCase())
    const matchProximite = !filtreProximite || !position || !e.lat || !e.lng ||
      getDistance(position.lat, position.lng, e.lat, e.lng) <= rayon
    const matchDate = !e.quand || new Date(e.quand) >= today
    return matchCategorie && matchRecherche && matchProximite && matchDate
  }).sort((a, b) => new Date(a.quand).getTime() - new Date(b.quand).getTime())

  const pubActuel = pubsFiltrees[pubIndex % Math.max(pubsFiltrees.length, 1)]

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-600">SortiesApp</h1>
          <p className="text-gray-500 text-sm">Trouve des activités près de chez toi</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const query = new URLSearchParams()
              if (filtreProximite && position) {
                query.set("lat", position.lat.toString())
                query.set("lng", position.lng.toString())
                query.set("rayon", rayon.toString())
              }
              if (categorieActive !== "Tout") query.set("categorie", categorieActive)
              router.push(`/carte?${query.toString()}`)
            }}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50"
          >
            🗺️ Carte
          </button>
          {user ? (
            <button onClick={() => router.push("/dashboard")} className="border border-purple-600 text-purple-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-50">
              Mon espace
            </button>
          ) : (
            <button onClick={() => router.push("/auth")} className="border border-purple-600 text-purple-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-50">
              Se connecter
            </button>
          )}
          <button onClick={() => router.push("/publier")} className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700">
            Publier un événement
          </button>
        </div>
      </header>

      {pubsFiltrees.length > 0 && showPub && pubActuel && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">Pub</span>
            <span className="text-sm font-medium text-amber-900">{pubActuel.nom_commerce}</span>
            <span className="text-sm text-amber-700">{pubActuel.description}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={pubActuel.lien} target="_blank" className="text-sm text-amber-600 font-medium hover:underline">En savoir plus →</a>
            <div className="flex gap-1">
              {pubsFiltrees.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === pubIndex % pubsFiltrees.length ? "bg-amber-600" : "bg-amber-300"}`}/>
              ))}
            </div>
            <button onClick={() => setShowPub(false)} className="text-amber-400 hover:text-amber-600 text-lg">✕</button>
          </div>
        </div>
      )}

      <section className="bg-purple-600 py-12 px-6 text-center">
        <h2 className="text-white text-3xl font-bold mb-4">Que faire près de chez toi ?</h2>
        <div className="relative max-w-xl mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Recherche un événement, une ville..."
            className="w-full pl-12 pr-10 py-4 rounded-full text-gray-800 shadow-xl outline-none border-2 border-white/30 focus:border-white text-sm font-medium placeholder-gray-400 bg-white"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          {recherche && (
            <button
              onClick={() => setRecherche("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>
          )}
        </div>
      </section>

      <section className="px-6 py-4 bg-white border-b flex gap-3 overflow-x-auto items-center">
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

        <div className="h-6 w-px bg-gray-200 mx-1 flex-shrink-0"/>

        {!filtreProximite ? (
          <button
            onClick={activerGeolocalisation}
            disabled={loadingGeo}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 text-blue-600 text-sm font-medium whitespace-nowrap hover:bg-blue-50 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {loadingGeo ? "⏳" : "📍"} Près de moi
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-blue-600 font-medium whitespace-nowrap">📍 {rayon} km</span>
            <input type="range" min="5" max="200" step="5" value={rayon} onChange={(e) => setRayon(Number(e.target.value))} className="w-24"/>
            <button onClick={desactiverGeolocalisation} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
          </div>
        )}
      </section>

      <section className="px-6 py-8 flex-1">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">⏳</p>
            <p className="text-lg">Chargement des événements...</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {evenementsFiltres.length} événement{evenementsFiltres.length > 1 ? "s" : ""} trouvé{evenementsFiltres.length > 1 ? "s" : ""}
              {filtreProximite && position && <span className="text-sm font-normal text-blue-600 ml-2">dans un rayon de {rayon} km</span>}
            </h3>
            {evenementsFiltres.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-4">😕</p>
                <p className="text-lg">Aucun événement trouvé</p>
                {filtreProximite && (
                  <button onClick={() => setRayon(r => Math.min(r + 25, 200))} className="mt-4 text-purple-600 font-medium hover:underline">
                    Élargir la zone de recherche →
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {evenementsFiltres.map((e) => (
                  <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow cursor-pointer relative">
                    <button onClick={(ev) => toggleFavori(ev, e.id)} className="absolute top-6 right-6 text-xl z-10 hover:scale-110 transition-transform">
                      {favoris.includes(e.id) ? "❤️" : "🤍"}
                    </button>
                    <div className="rounded-lg h-32 mb-3 overflow-hidden">
                      {e.image_url ? (
                        <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover"/>
                      ) : (
                        <div className={`${e.couleur} w-full h-full flex items-center justify-center text-4xl`}>{e.emoji}</div>
                      )}
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">{e.categorie}</span>
                    <h4 className="font-bold text-gray-800 mt-2">{e.titre}</h4>
                    <p className="text-gray-500 text-sm">{e.ville} • {formatDate(e.quand)}</p>
                    {filtreProximite && position && e.lat && e.lng && (
                      <p className="text-blue-500 text-xs mt-1">📍 {Math.round(getDistance(position.lat, position.lng, e.lat, e.lng))} km</p>
                    )}
                    <p className={`font-medium text-sm mt-1 ${e.prix === "Gratuit" ? "text-green-600" : "text-gray-800"}`}>{e.prix}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <footer className="bg-white border-t border-gray-200 mt-12 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-purple-600 text-lg mb-3">SortiesApp</h3>
              <p className="text-gray-500 text-sm">Trouve des activités et événements près de chez toi.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-3">Navigation</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/")} className="text-gray-500 text-sm text-left hover:text-purple-600">Accueil</button>
                <button onClick={() => router.push("/carte")} className="text-gray-500 text-sm text-left hover:text-purple-600">Carte des événements</button>
                <button onClick={() => router.push("/publier")} className="text-gray-500 text-sm text-left hover:text-purple-600">Publier un événement</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-3">Aide & Support</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-purple-600">Nous contacter</button>
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-purple-600">Remboursement</button>
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-purple-600">Signaler un événement</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-3">Travailler avec nous</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-purple-600">Partenariat local</button>
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-purple-600">Programme d'affiliation</button>
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-purple-600">Publicité</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
            <p className="text-gray-400 text-sm">© 2026 SortiesApp. Tous droits réservés.</p>
            <div className="flex gap-4">
              <button onClick={() => router.push("/mentions-legales")} className="text-gray-400 text-sm hover:text-purple-600">Mentions légales</button>
              <button onClick={() => router.push("/cgu")} className="text-gray-400 text-sm hover:text-purple-600">CGU</button>
              <button onClick={() => router.push("/contact")} className="text-gray-400 text-sm hover:text-purple-600">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}