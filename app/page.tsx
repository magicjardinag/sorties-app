"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ""
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return "Demain"
  if (diff <= 6) return ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][d.getDay()]
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function getJoursSemaine() {
  const jours = []
  const today = new Date(); today.setHours(0,0,0,0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    jours.push({
      label: i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][d.getDay()],
      date: d.toISOString().split("T")[0],
      num: d.getDate(),
    })
  }
  return jours
}

const categories = [
  { label: "Tout", emoji: "✨" },
  { label: "Musique", emoji: "🎵" },
  { label: "Sport", emoji: "🏃" },
  { label: "Culture", emoji: "🎨" },
  { label: "Food", emoji: "🍕" },
  { label: "Nature", emoji: "🌿" },
  { label: "Gratuit", emoji: "🎁" },
]

export default function Home() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [favoris, setFavoris] = useState<string[]>([])
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null)
  const [rayon, setRayon] = useState(50)
  const [filtreProximite, setFiltreProximite] = useState(false)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [categorieActive, setCategorieActive] = useState("Tout")
  const [jourActif, setJourActif] = useState("tout")
  const [recherche, setRecherche] = useState("")
  const [pubs, setPubs] = useState<any[]>([])
  const [pubIndex, setPubIndex] = useState(0)
  const [showPub, setShowPub] = useState(true)
  const [showCategories, setShowCategories] = useState(false)

  const jours = getJoursSemaine()
  const catActive = categories.find(c => c.label === categorieActive)

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase.from("evenements").select("*").eq("statut", "approuve")
      setEvenements(data || [])
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
    fetchAll(); fetchUser(); fetchPubs()
  }, [])

  useEffect(() => {
    if (pubs.length === 0) return
    const interval = setInterval(() => setPubIndex(p => (p + 1) % pubs.length), 4000)
    return () => clearInterval(interval)
  }, [pubs])

  const activerGeo = () => {
    setLoadingGeo(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setFiltreProximite(true); setLoadingGeo(false) },
      () => { alert("Position non disponible."); setLoadingGeo(false) }
    )
  }

  const toggleFavori = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!user) { router.push("/auth"); return }
    if (favoris.includes(id)) {
      await supabase.from("favoris").delete().eq("user_id", user.id).eq("evenement_id", id)
      setFavoris(favoris.filter(f => f !== id))
    } else {
      await supabase.from("favoris").insert({ user_id: user.id, evenement_id: id })
      setFavoris([...favoris, id])
    }
  }

  const today = new Date(); today.setHours(0,0,0,0)

  const evenementsFiltres = evenements.filter(e => {
    const d = new Date(e.quand); d.setHours(0,0,0,0)
    if (d < today) return false
    if (jourActif !== "tout" && e.quand !== jourActif) return false
    if (categorieActive !== "Tout" && categorieActive !== "Gratuit" && e.categorie !== categorieActive) return false
    if (categorieActive === "Gratuit" && e.prix !== "Gratuit") return false
    if (recherche && !e.titre.toLowerCase().includes(recherche.toLowerCase()) && !e.ville.toLowerCase().includes(recherche.toLowerCase())) return false
    if (filtreProximite && position && e.lat && e.lng && getDistance(position.lat, position.lng, e.lat, e.lng) > rayon) return false
    return true
  }).sort((a, b) => new Date(a.quand).getTime() - new Date(b.quand).getTime())

  const pubActuel = pubs[pubIndex % Math.max(pubs.length, 1)]

  return (
    <main className="min-h-screen bg-black text-white">

      <header className="bg-black px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">SortiesApp</h1>
          {filtreProximite && position && (
            <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">📍 {rayon} km</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const q = new URLSearchParams(); if (filtreProximite && position) { q.set("lat", position.lat.toString()); q.set("lng", position.lng.toString()); q.set("rayon", rayon.toString()) } if (categorieActive !== "Tout") q.set("categorie", categorieActive); router.push(`/carte?${q.toString()}`) }} className="p-2 text-gray-400 hover:text-white text-lg">🗺️</button>
          <button onClick={() => router.push("/tarifs")} className="p-2 text-gray-400 hover:text-white text-lg">💎</button>
          {user ? (
            <button onClick={() => router.push("/dashboard")} className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-700">Mon espace</button>
          ) : (
            <button onClick={() => router.push("/auth")} className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-700">Connexion</button>
          )}
          <button onClick={() => router.push("/publier")} className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-red-600">+ Publier</button>
        </div>
      </header>

      {pubs.length > 0 && showPub && pubActuel && (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">PUB</span>
            <span className="text-sm text-gray-300">{pubActuel.nom_commerce} — {pubActuel.description}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={pubActuel.lien} target="_blank" className="text-xs text-yellow-400 hover:underline">En savoir plus →</a>
            <button onClick={() => setShowPub(false)} className="text-gray-600 hover:text-gray-400">✕</button>
          </div>
        </div>
      )}

      <div className="px-6 py-4 bg-black">
        <div className="relative max-w-2xl mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="Recherche un événement, une ville..."
            className="w-full pl-11 pr-10 py-3 bg-gray-900 border border-gray-700 rounded-full text-white placeholder-gray-500 outline-none focus:border-gray-500 text-sm"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          {recherche && (
            <button onClick={() => setRecherche("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>
          )}
        </div>
      </div>

      <div className="px-6 pb-4 bg-black overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button onClick={() => setJourActif("tout")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${jourActif === "tout" ? "bg-white text-black" : "bg-gray-900 text-gray-400 hover:bg-gray-800"}`}>
            Tous
          </button>
          {jours.map((j) => (
            <button key={j.date} onClick={() => setJourActif(j.date)} className={`flex flex-col items-center px-4 py-2 rounded-full text-sm font-medium transition-colors min-w-16 ${jourActif === j.date ? "bg-white text-black" : "bg-gray-900 text-gray-400 hover:bg-gray-800"}`}>
              <span className="text-xs">{j.label}</span>
              <span className="font-bold">{j.num}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Barre filtres avec dropdown catégories horizontal */}
      <div className="px-6 pb-4 bg-black border-b border-gray-800 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${categorieActive !== "Tout" ? "bg-white text-black" : "bg-gray-900 text-gray-400 hover:bg-gray-800"}`}
          >
            {categorieActive === "Tout" ? "✨ Catégories" : `${catActive?.emoji} ${categorieActive}`}
            <span className="text-xs ml-1">{showCategories ? "▴" : "▾"}</span>
          </button>

          {showCategories && (
            <>
              {/* Overlay pour fermer en cliquant ailleurs */}
              <div className="fixed inset-0 z-40" onClick={() => setShowCategories(false)}/>
              <div className="absolute top-full left-0 mt-2 z-50">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-2 shadow-xl flex flex-row gap-1" style={{ whiteSpace: "nowrap" }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => { setCategorieActive(cat.label); setShowCategories(false) }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${categorieActive === cat.label ? "bg-white text-black" : "text-gray-300 hover:bg-gray-800"}`}
                    >
                      <span>{cat.emoji}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-gray-700"/>

        {!filtreProximite ? (
          <button onClick={activerGeo} disabled={loadingGeo} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-blue-400 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {loadingGeo ? "⏳" : "📍"} Près de moi
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-sm font-medium">📍 {rayon} km</span>
            <input type="range" min="5" max="200" step="5" value={rayon} onChange={(e) => setRayon(Number(e.target.value))} className="w-20 accent-blue-500"/>
            <button onClick={() => { setFiltreProximite(false); setPosition(null) }} className="text-gray-600 hover:text-gray-400">✕</button>
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-600"><p className="text-4xl mb-4">⏳</p><p>Chargement...</p></div>
        ) : evenementsFiltres.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-4xl mb-4">😕</p>
            <p>Aucun événement trouvé</p>
            {filtreProximite && <button onClick={() => setRayon(r => Math.min(r + 25, 200))} className="mt-4 text-blue-400 hover:underline text-sm">Élargir la zone →</button>}
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">{evenementsFiltres.length} événement{evenementsFiltres.length > 1 ? "s" : ""}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {evenementsFiltres.map((e) => (
                <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)} className="relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200" style={{ aspectRatio: "1/1" }}>
                  {e.image_url ? (
                    <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover"/>
                  ) : (
                    <div className={`${e.couleur} w-full h-full flex items-center justify-center text-6xl`}>{e.emoji}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"/>
                  <button onClick={(ev) => toggleFavori(ev, e.id)} className="absolute top-3 right-3 text-xl z-10 hover:scale-110 transition-transform">
                    {favoris.includes(e.id) ? "❤️" : "🤍"}
                  </button>
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">{e.emoji} {e.categorie}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="font-bold text-white text-sm leading-tight mb-1">{e.titre}</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-300 text-xs">{e.ville}</p>
                        <p className="text-gray-400 text-xs">{formatDateShort(e.quand)}{e.heure ? ` · ${e.heure}` : ""}</p>
                      </div>
                      <span className={`text-xs font-bold ${e.prix === "Gratuit" ? "text-green-400" : "text-white"}`}>{e.prix}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="bg-gray-900 border-t border-gray-800 mt-12 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white text-lg mb-3">SortiesApp</h3>
              <p className="text-gray-500 text-sm">Trouve des activités et événements près de chez toi.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-300 mb-3">Navigation</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/")} className="text-gray-500 text-sm text-left hover:text-white">Accueil</button>
                <button onClick={() => router.push("/carte")} className="text-gray-500 text-sm text-left hover:text-white">Carte</button>
                <button onClick={() => router.push("/publier")} className="text-gray-500 text-sm text-left hover:text-white">Publier</button>
                <button onClick={() => router.push("/tarifs")} className="text-gray-500 text-sm text-left hover:text-white">Tarifs</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-300 mb-3">Support</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-white">Contact</button>
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-white">Signaler</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-300 mb-3">Partenaires</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-white">Partenariat</button>
                <button onClick={() => router.push("/contact")} className="text-gray-500 text-sm text-left hover:text-white">Publicité</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex items-center justify-between">
            <p className="text-gray-600 text-sm">© 2026 SortiesApp</p>
            <div className="flex gap-4">
              <button onClick={() => router.push("/mentions-legales")} className="text-gray-600 text-sm hover:text-white">Mentions légales</button>
              <button onClick={() => router.push("/cgu")} className="text-gray-600 text-sm hover:text-white">CGU</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}