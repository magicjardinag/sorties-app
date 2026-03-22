"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAIL = "a.giraudon@astem.fr"

const categories = [
  { label: "Tout", emoji: "✨" },
  { label: "Musique", emoji: "🎵" },
  { label: "Sport", emoji: "🏃" },
  { label: "Danse", emoji: "💃" },
  { label: "Culture", emoji: "🎨" },
  { label: "Atelier", emoji: "🛠️" },
  { label: "Food", emoji: "🍕" },
  { label: "Nature & Rando", emoji: "🌿" },
  { label: "Animaux", emoji: "🐾" },
  { label: "Brocante", emoji: "🏺" },
  { label: "Bar & Nuit", emoji: "🍸" },
  { label: "Loto", emoji: "🎰" },
  { label: "Enfants", emoji: "🧒" },
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

function getJoursSemaine() {
  const jours = []
  const today = new Date(); today.setHours(0,0,0,0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    jours.push({
      label: i === 0 ? "Auj." : i === 1 ? "Dem." : ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][d.getDay()],
      date: d.toISOString().split("T")[0],
      num: d.getDate(),
    })
  }
  return jours
}

function MiniCalendrier({ evenements, jourActif, setJourActif, onClose }: {
  evenements: Evenement[]
  jourActif: string
  setJourActif: (d: string) => void
  onClose: () => void
}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [moisActuel, setMoisActuel] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const annee = moisActuel.getFullYear()
  const mois = moisActuel.getMonth()
  const premierJour = new Date(annee, mois, 1).getDay()
  const nbJours = new Date(annee, mois + 1, 0).getDate()
  const offset = premierJour === 0 ? 6 : premierJour - 1
  const datesAvecEvenements = new Set(evenements.map(e => e.quand))
  const joursNoms = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]
  const moisNoms = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMoisActuel(new Date(annee, mois - 1, 1))} className="text-gray-400 hover:text-orange-500 text-lg px-1">‹</button>
        <p className="font-bold text-gray-800 text-sm">{moisNoms[mois]} {annee}</p>
        <button onClick={() => setMoisActuel(new Date(annee, mois + 1, 1))} className="text-gray-400 hover:text-orange-500 text-lg px-1">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {joursNoms.map(j => <p key={j} className="text-center text-xs text-gray-400 font-medium py-1">{j}</p>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`}/>)}
        {Array.from({ length: nbJours }).map((_, i) => {
          const jour = i + 1
          const dateStr = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`
          const hasEvent = datesAvecEvenements.has(dateStr)
          const isToday = dateStr === today.toISOString().split("T")[0]
          const isSelected = jourActif === dateStr
          const isPast = new Date(dateStr) < today
          return (
            <button
              key={dateStr}
              onClick={() => setJourActif(isSelected ? "tout" : dateStr)}
              disabled={isPast && !hasEvent}
              className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-xs font-medium transition-all
                ${isSelected ? "bg-orange-500 text-white" :
                  isToday ? "bg-orange-100 text-orange-600 font-bold" :
                  isPast ? "text-gray-300 cursor-not-allowed" :
                  hasEvent ? "text-gray-800 hover:bg-orange-50 cursor-pointer" :
                  "text-gray-400 hover:bg-gray-50 cursor-pointer"}`}
            >
              {jour}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400"/>
              )}
            </button>
          )
        })}
      </div>
      {jourActif !== "tout" && (
        <button onClick={() => setJourActif("tout")} className="mt-3 w-full text-xs text-orange-500 hover:underline text-center">
          Voir tous les événements ×
        </button>
      )}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [categorieActive, setCategorieActive] = useState("Tout")
  const [jourActif, setJourActif] = useState("tout")
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
  const [showCalendrier, setShowCalendrier] = useState(false)
  const [menuMobileOpen, setMenuMobileOpen] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  const jours = getJoursSemaine()

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

  // Close calendrier on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendrier(false)
      }
    }
    if (showCalendrier) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showCalendrier])

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
    const matchJour = jourActif === "tout" || e.quand === jourActif
    return matchCategorie && matchRecherche && matchProximite && matchDate && matchJour
  }).sort((a, b) => new Date(a.quand).getTime() - new Date(b.quand).getTime())

  const pubActuel = pubsFiltrees[pubIndex % Math.max(pubsFiltrees.length, 1)]

  return (
    <main className="min-h-screen bg-[#F7F6F2]">

      {/* ── HEADER ── */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <button onClick={() => router.push("/")} className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xl font-black tracking-tight text-gray-900">Sorties<span className="text-orange-500">App</span></span>
          </button>

          {/* Search — desktop */}
          <div className="hidden sm:flex flex-1 max-w-md items-center bg-gray-100 rounded-2xl px-4 py-2.5 gap-2">
            <span className="text-gray-400 text-base">🔍</span>
            <input
              type="text"
              placeholder="Événement, ville..."
              className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400 font-medium"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            {recherche && (
              <button onClick={() => setRecherche("")} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              🗺️ <span className="hidden md:inline">Carte</span>
            </button>
            {user?.email === ADMIN_EMAIL && (
              <button onClick={() => router.push("/admin")} className="px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">⚙️</button>
            )}
            {user ? (
              <button onClick={() => router.push("/dashboard")} className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Mon espace</button>
            ) : (
              <button onClick={() => router.push("/auth")} className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Se connecter</button>
            )}
            <button onClick={() => router.push("/publier")} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
              + Publier
            </button>
          </div>

          {/* Mobile icons */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => router.push("/carte")}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-base"
            >🗺️</button>
            <button
              onClick={() => setMenuMobileOpen(!menuMobileOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-base"
            >☰</button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="sm:hidden px-4 pb-3">
          <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-2.5 gap-2">
            <span className="text-gray-400 text-base">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un événement, une ville..."
              className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            {recherche && (
              <button onClick={() => setRecherche("")} className="text-gray-400 text-sm">✕</button>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuMobileOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
            {user ? (
              <button onClick={() => { router.push("/dashboard"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">👤 Mon espace</button>
            ) : (
              <button onClick={() => { router.push("/auth"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">Se connecter</button>
            )}
            <button onClick={() => { router.push("/tarifs"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">💎 Tarifs</button>
            {user?.email === ADMIN_EMAIL && (
              <button onClick={() => { router.push("/admin"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">⚙️ Admin</button>
            )}
            <button onClick={() => { router.push("/publier"); setMenuMobileOpen(false) }} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold text-center">+ Publier un événement</button>
          </div>
        )}
      </header>

      {/* ── PUB BANNER ── */}
      {pubsFiltrees.length > 0 && showPub && pubActuel && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Pub</span>
            <span className="text-sm font-semibold text-amber-900 truncate">{pubActuel.nom_commerce}</span>
            <span className="text-sm text-amber-700 hidden sm:inline truncate">{pubActuel.description}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={pubActuel.lien} target="_blank" className="text-xs text-amber-600 font-semibold hover:underline whitespace-nowrap">Voir →</a>
            <div className="flex gap-1">
              {pubsFiltrees.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === pubIndex % pubsFiltrees.length ? "bg-amber-600" : "bg-amber-300"}`}/>
              ))}
            </div>
            <button onClick={() => setShowPub(false)} className="text-amber-400 hover:text-amber-700 text-base leading-none">✕</button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="bg-white px-4 sm:px-6 pt-6 pb-4 sm:pt-8 sm:pb-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
            Que faire près de <span className="text-orange-500">chez toi ?</span>
          </h2>
          <p className="text-gray-500 text-sm mb-5">Découvre les événements locaux autour de toi</p>

          {/* Jours de la semaine */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => { setJourActif("tout"); setShowCalendrier(false) }}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                jourActif === "tout"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tous
            </button>
            {jours.map((j) => (
              <button
                key={j.date}
                onClick={() => { setJourActif(j.date); setShowCalendrier(false) }}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-2xl text-sm font-semibold transition-all min-w-[52px] ${
                  jourActif === j.date
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="text-[10px] font-medium opacity-80">{j.label}</span>
                <span className="text-base font-black leading-tight">{j.num}</span>
              </button>
            ))}
            <div className="w-px flex-shrink-0 bg-gray-200 mx-1 self-stretch"/>
            <div className="relative flex-shrink-0" ref={calRef}>
              <button
                onClick={() => setShowCalendrier(!showCalendrier)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                  showCalendrier || (jourActif !== "tout" && !jours.find(j => j.date === jourActif))
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                📅
                <span className="hidden sm:inline">
                  {jourActif !== "tout" && !jours.find(j => j.date === jourActif)
                    ? new Date(jourActif).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                    : "Agenda"}
                </span>
              </button>
              {showCalendrier && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <MiniCalendrier
                    evenements={evenements.filter(e => new Date(e.quand) >= today)}
                    jourActif={jourActif}
                    setJourActif={setJourActif}
                    onClose={() => setShowCalendrier(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ── */}
      <section className="bg-white border-t border-gray-100 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 items-center">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setCategorieActive(cat.label)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${
                  categorieActive === cat.label
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="text-base leading-none">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0"/>
            {!filtreProximite ? (
              <button
                onClick={activerGeolocalisation}
                disabled={loadingGeo}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50"
              >
                {loadingGeo ? "⏳" : "📍"} <span>Près de moi</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0 bg-blue-50 rounded-2xl px-3 py-2">
                <span className="text-xs text-blue-600 font-semibold whitespace-nowrap">📍 {rayon} km</span>
                <input type="range" min="5" max="200" step="5" value={rayon} onChange={(e) => setRayon(Number(e.target.value))} className="w-20"/>
                <button onClick={desactiverGeolocalisation} className="text-blue-400 hover:text-blue-700 text-sm font-bold">✕</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── EVENTS GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Count + filters summary */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <p className="text-sm font-semibold text-gray-700">
            {loading ? "Chargement..." : (
              <>
                <span className="text-orange-500 font-black">{evenementsFiltres.length}</span>
                {" "}événement{evenementsFiltres.length > 1 ? "s" : ""}
                {filtreProximite && position && <span className="text-blue-500 ml-1">· {rayon} km</span>}
                {jourActif !== "tout" && (
                  <span className="text-gray-500 font-normal ml-1">
                    · {new Date(jourActif).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-100"/>
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full w-1/2"/>
                  <div className="h-4 bg-gray-100 rounded-full w-3/4"/>
                  <div className="h-3 bg-gray-100 rounded-full w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ) : evenementsFiltres.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">😕</p>
            <p className="text-lg font-semibold text-gray-600 mb-1">Aucun événement trouvé</p>
            <p className="text-sm text-gray-400 mb-4">Essaie de modifier tes filtres</p>
            {filtreProximite && (
              <button
                onClick={() => setRayon(r => Math.min(r + 25, 200))}
                className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600"
              >
                Élargir la zone → {rayon + 25} km
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {evenementsFiltres.map((e) => (
              <div
                key={e.id}
                onClick={() => router.push(`/evenement/${e.id}`)}
                className="bg-white rounded-2xl overflow-hidden cursor-pointer group hover:shadow-md transition-all duration-200 active:scale-[0.98]"
              >
                {/* Image / couleur */}
                <div className="relative h-36 overflow-hidden">
                  {e.image_url ? (
                    <img
                      src={e.image_url}
                      alt={e.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`${e.couleur} w-full h-full flex items-center justify-center text-5xl`}>{e.emoji}</div>
                  )}
                  {/* Favori */}
                  <button
                    onClick={(ev) => toggleFavori(ev, e.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-base shadow-sm hover:scale-110 transition-transform z-10"
                  >
                    {favoris.includes(e.id) ? "❤️" : "🤍"}
                  </button>
                  {/* Prix badge */}
                  <div className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                    e.prix === "Gratuit"
                      ? "bg-green-500 text-white"
                      : "bg-white/90 text-gray-800"
                  }`}>
                    {e.prix === "Gratuit" ? "Gratuit" : e.prix}
                  </div>
                </div>

                {/* Infos */}
                <div className="p-3">
                  <span className="inline-block text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full mb-1.5">
                    {e.categorie}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">{e.titre}</h4>
                  <p className="text-gray-400 text-xs truncate">
                    {e.ville}
                    {e.quand && <> · <span className="text-orange-400 font-medium">{formatDate(e.quand)}</span></>}
                    {e.heure && <> · {e.heure}</>}
                  </p>
                  {filtreProximite && position && e.lat && e.lng && (
                    <p className="text-blue-400 text-xs mt-1 font-medium">
                      📍 {Math.round(getDistance(position.lat, position.lng, e.lat, e.lng))} km
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 mt-8 py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-black text-gray-900 text-lg mb-2">Sorties<span className="text-orange-500">App</span></h3>
              <p className="text-gray-400 text-sm leading-relaxed">Trouve des activités et événements près de chez toi.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-3">Navigation</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Accueil</button>
                <button onClick={() => router.push("/carte")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Carte</button>
                <button onClick={() => router.push("/publier")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Publier</button>
                <button onClick={() => router.push("/tarifs")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Tarifs</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-3">Support</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/contact")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Contact</button>
                <button onClick={() => router.push("/contact")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Remboursement</button>
                <button onClick={() => router.push("/contact")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Signaler</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-3">Partenaires</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/contact")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Partenariat local</button>
                <button onClick={() => router.push("/contact")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Affiliation</button>
                <button onClick={() => router.push("/contact")} className="text-gray-400 text-sm text-left hover:text-orange-500 transition-colors">Publicité</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-300 text-xs">© 2026 SortiesApp. Tous droits réservés.</p>
            <div className="flex gap-4">
              <button onClick={() => router.push("/mentions-legales")} className="text-gray-300 text-xs hover:text-orange-500 transition-colors">Mentions légales</button>
              <button onClick={() => router.push("/cgu")} className="text-gray-300 text-xs hover:text-orange-500 transition-colors">CGU</button>
              <button onClick={() => router.push("/contact")} className="text-gray-300 text-xs hover:text-orange-500 transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          <button onClick={() => router.push("/")} className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-semibold text-orange-500">Accueil</span>
          </button>
          <button
            onClick={() => router.push("/carte")}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl"
          >
            <span className="text-xl">🗺️</span>
            <span className="text-[10px] font-semibold text-gray-400">Carte</span>
          </button>
          <button
            onClick={() => router.push("/publier")}
            className="flex flex-col items-center gap-0.5 -mt-5"
          >
            <span className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-200">+</span>
          </button>
          <button
            onClick={() => user ? router.push("/dashboard") : router.push("/auth")}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl"
          >
            <span className="text-xl">❤️</span>
            <span className="text-[10px] font-semibold text-gray-400">Favoris</span>
          </button>
          <button
            onClick={() => user ? router.push("/dashboard") : router.push("/auth")}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl"
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-semibold text-gray-400">{user ? "Moi" : "Connexion"}</span>
          </button>
        </div>
      </nav>

      {/* Spacer for bottom nav on mobile */}
      <div className="sm:hidden h-20"/>
    </main>
  )
}
