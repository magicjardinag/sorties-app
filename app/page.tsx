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

const ROTATING_WORDS = [
  "chez toi !",
  "au canapé !",
  "à rien faire !",
  "seul(e) !",
  "en mode Netflix !",
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

function getFiltreDates() {
  const today = new Date(); today.setHours(0,0,0,0)
  const demain = new Date(today); demain.setDate(today.getDate() + 1)
  const jourSemaine = today.getDay()
  const joursSamedi = jourSemaine === 6 ? 0 : (6 - jourSemaine)
  const samedi = new Date(today); samedi.setDate(today.getDate() + joursSamedi)
  const dimanche = new Date(samedi); dimanche.setDate(samedi.getDate() + 1)
  return {
    today: today.toISOString().split("T")[0],
    demain: demain.toISOString().split("T")[0],
    samedi: samedi.toISOString().split("T")[0],
    dimanche: dimanche.toISOString().split("T")[0],
  }
}

function RotatingWord() {
  const [index, setIndex] = useState(0)
  const [exiting, setExiting] = useState(false)
  useEffect(() => {
    const interval = setInterval(() => {
      setExiting(true)
      setTimeout(() => { setIndex(i => (i + 1) % ROTATING_WORDS.length); setExiting(false) }, 280)
    }, 2500)
    return () => clearInterval(interval)
  }, [])
  return (
    <span className="inline-block transition-all duration-280" style={{ color: "#FF4D00", opacity: exiting ? 0 : 1, transform: exiting ? "translateY(-14px)" : "translateY(0)" }}>
      {ROTATING_WORDS[index]}
    </span>
  )
}

function MiniCalendrier({ evenements, jourActif, setJourActif }: {
  evenements: Evenement[]
  jourActif: string
  setJourActif: (d: string) => void
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
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-900 p-4 w-72">
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
            <button key={dateStr} onClick={() => setJourActif(isSelected ? "tout" : dateStr)} disabled={isPast && !hasEvent}
              className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-xs font-medium transition-all ${isSelected ? "bg-orange-500 text-white" : isToday ? "bg-orange-100 text-orange-600 font-bold" : isPast ? "text-gray-300 cursor-not-allowed" : hasEvent ? "text-gray-800 hover:bg-orange-50 cursor-pointer" : "text-gray-400 hover:bg-gray-50 cursor-pointer"}`}>
              {jour}
              {hasEvent && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400"/>}
            </button>
          )
        })}
      </div>
      {jourActif !== "tout" && (
        <button onClick={() => setJourActif("tout")} className="mt-3 w-full text-xs text-orange-500 hover:underline text-center">Voir tous les événements ×</button>
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
  const [favoris, setFavoris] = useState<string[]>([])
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null)
  const [rayon, setRayon] = useState(50)
  const [filtreProximite, setFiltreProximite] = useState(false)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [showCalendrier, setShowCalendrier] = useState(false)
  const [menuMobileOpen, setMenuMobileOpen] = useState(false)

  const dates = getFiltreDates()

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
    fetchEvenements(); fetchUser(); fetchPubs()
  }, [])

  useEffect(() => {
    if (pubsFiltrees.length === 0) return
    const interval = setInterval(() => setPubIndex((prev) => (prev + 1) % pubsFiltrees.length), 4000)
    return () => clearInterval(interval)
  }, [pubs, position])

  const activerGeolocalisation = () => {
    setLoadingGeo(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setFiltreProximite(true); setLoadingGeo(false) },
      () => { alert("Impossible d'accéder à ta position."); setLoadingGeo(false) }
    )
  }

  const desactiverGeolocalisation = () => { setFiltreProximite(false); setPosition(null) }

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
    ? pubs.filter((pub) => !pub.lat || !pub.lng || getDistance(position.lat, position.lng, pub.lat, pub.lng) <= (pub.rayon || 50))
    : pubs

  const today = new Date(); today.setHours(0, 0, 0, 0)

  const evenementsFiltres = evenements.filter((e) => {
    const matchCategorie = categorieActive === "Tout" || (categorieActive === "Gratuit" ? e.prix === "Gratuit" : e.categorie === categorieActive)
    const matchRecherche = e.titre.toLowerCase().includes(recherche.toLowerCase()) || e.ville.toLowerCase().includes(recherche.toLowerCase())
    const matchProximite = !filtreProximite || !position || !e.lat || !e.lng || getDistance(position.lat, position.lng, e.lat, e.lng) <= rayon
    const matchDate = !e.quand || new Date(e.quand) >= today
    const matchJour = jourActif === "tout" ? true : jourActif === "weekend" ? (e.quand === dates.samedi || e.quand === dates.dimanche) : e.quand === jourActif
    return matchCategorie && matchRecherche && matchProximite && matchDate && matchJour
  }).sort((a, b) => new Date(a.quand).getTime() - new Date(b.quand).getTime())

  const pubActuel = pubsFiltrees[pubIndex % Math.max(pubsFiltrees.length, 1)]

  const filtresBoutons = [
    { label: "Tous", value: "tout" },
    { label: "Aujourd'hui", value: dates.today },
    { label: "Demain", value: dates.demain },
    { label: "Ce week-end", value: "weekend" },
  ]

  const prochains = evenements.filter(e => e.quand && new Date(e.quand) >= today).sort((a, b) => new Date(a.quand).getTime() - new Date(b.quand).getTime()).slice(0, 3)
  const FALLBACK_CARDS = [
    { emoji: "🥾", titre: "Randonnée des gorges", ville: "Sisteron", heure: "08:00", tag: "Gratuit", tagStyle: { background: "#DCFCE7", color: "#166534", borderColor: "#22c55e" } },
    { emoji: "🎸", titre: "Festival musiques du monde", ville: "Figeac", heure: "17:00", tag: "Demain", tagStyle: { background: "#FEE2E2", color: "#991b1b", borderColor: "#ef4444" } },
    { emoji: "🏃", titre: "Tournoi de pétanque", ville: "Apt", heure: "14:00", tag: "Aujourd'hui", tagStyle: { background: "#FFF3C4", color: "#854d0e", borderColor: "#f59e0b" } },
  ]
  const heroCards = prochains.length > 0
    ? prochains.map(e => ({ emoji: e.emoji || "🎉", titre: e.titre, ville: e.ville, heure: e.heure, tag: e.prix === "Gratuit" ? "Gratuit" : formatDate(e.quand), tagStyle: e.prix === "Gratuit" ? { background: "#DCFCE7", color: "#166534", borderColor: "#22c55e" } : formatDate(e.quand) === "Aujourd'hui" ? { background: "#FFF3C4", color: "#854d0e", borderColor: "#f59e0b" } : { background: "#FEE2E2", color: "#991b1b", borderColor: "#ef4444" }, id: e.id }))
    : FALLBACK_CARDS

  const isAgendaActif = showCalendrier || (jourActif !== "tout" && jourActif !== "weekend" && jourActif !== dates.today && jourActif !== dates.demain)

  return (
    <main className="min-h-screen" style={{ background: "#F7F6F2" }}>

      {/* HEADER */}
      <header className="bg-white sticky top-0 z-40 border-b-2 border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button onClick={() => router.push("/")} className="flex-shrink-0 font-black text-xl tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -1 }}>
            Sorties<span style={{ color: "#FF4D00" }}>App</span>
          </button>
          <div className="hidden sm:flex flex-1 max-w-md items-center bg-gray-100 border border-gray-200 rounded-full px-4 py-2.5 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Événement, ville..." className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400 font-medium" value={recherche} onChange={(e) => setRecherche(e.target.value)}/>
            {recherche && <button onClick={() => setRecherche("")} className="text-gray-400 text-sm">✕</button>}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => { const q = new URLSearchParams(); if (filtreProximite && position) { q.set("lat", position.lat.toString()); q.set("lng", position.lng.toString()); q.set("rayon", rayon.toString()) } if (categorieActive !== "Tout") q.set("categorie", categorieActive); router.push(`/carte?${q.toString()}`) }} className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100">🗺️ <span className="hidden md:inline">Carte</span></button>
            {user?.email === ADMIN_EMAIL && <button onClick={() => router.push("/admin")} className="px-3 py-2 rounded-full border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50">⚙️</button>}
            {user ? <button onClick={() => router.push("/dashboard")} className="px-3 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100">Mon espace</button>
              : <button onClick={() => router.push("/auth")} className="px-3 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100">Se connecter</button>}
            <button onClick={() => router.push("/publier")} className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: "#FF4D00" }}>+ Publier</button>
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={() => router.push("/carte")} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-base">🗺️</button>
            <button onClick={() => setMenuMobileOpen(!menuMobileOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-base font-bold">☰</button>
          </div>
        </div>
        <div className="sm:hidden px-4 pb-3">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2.5 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Rechercher..." className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400" value={recherche} onChange={(e) => setRecherche(e.target.value)}/>
            {recherche && <button onClick={() => setRecherche("")} className="text-gray-400 text-sm">✕</button>}
          </div>
        </div>
        {menuMobileOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
            {user ? <button onClick={() => { router.push("/dashboard"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">👤 Mon espace</button>
              : <button onClick={() => { router.push("/auth"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">Se connecter</button>}
            <button onClick={() => { router.push("/tarifs"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">💎 Tarifs</button>
            {user?.email === ADMIN_EMAIL && <button onClick={() => { router.push("/admin"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">⚙️ Admin</button>}
            <button onClick={() => { router.push("/publier"); setMenuMobileOpen(false) }} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white text-center" style={{ background: "#FF4D00" }}>+ Publier un événement</button>
          </div>
        )}
      </header>

      {/* PUB */}
      {pubsFiltrees.length > 0 && pubActuel && (
        <div className="border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3" style={{ background: "#FFF3C4" }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded font-bold tracking-wide" style={{ background: "#1a1a1a", color: "#FFF3C4" }}>PUB</span>
            <span className="text-sm font-bold text-gray-900 truncate">{pubActuel.nom_commerce}</span>
            <span className="text-sm text-amber-700 hidden sm:inline truncate">{pubActuel.description}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={pubActuel.lien} target="_blank" className="text-xs font-bold hover:underline whitespace-nowrap" style={{ color: "#FF4D00" }}>Voir →</a>
            <div className="flex gap-1">{pubsFiltrees.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === pubIndex % pubsFiltrees.length ? "bg-gray-900" : "bg-amber-300"}`}/>)}</div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="bg-white border-b-2 border-gray-900 px-4 sm:px-8 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 text-xs font-bold text-amber-800 mb-5" style={{ background: "#FFF3C4" }}>
              <span>🌞</span>
              <span>{loading ? "..." : evenementsFiltres.length} événements près de toi</span>
            </div>
            <h1 className="font-black leading-none mb-4" style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-2px", color: "#1a1a1a" }}>
              Fini de rester<br /><RotatingWord />
            </h1>
            <p className="text-gray-500 text-base mb-7 leading-relaxed">Découvre les meilleures sorties, concerts, randos<br className="hidden sm:block" /> et événements locaux autour de toi.</p>
            <div className="flex items-center bg-white border-2 border-gray-900 rounded-full px-4 py-1.5 gap-3 max-w-lg" style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
              <span className="text-gray-400">🔍</span>
              <input type="text" placeholder="Un concert à Lyon, une rando ce week-end..." className="bg-transparent flex-1 text-sm text-gray-900 outline-none placeholder-gray-400 py-2" value={recherche} onChange={(e) => setRecherche(e.target.value)}/>
              <button className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold text-white" style={{ background: "#FF4D00" }}>Chercher →</button>
            </div>
            <div className="flex items-center gap-5 mt-6 flex-wrap">
              {[
                { num: loading ? "..." : String(evenements.filter(e => e.quand === dates.today).length || 0), label: "aujourd'hui" },
                { num: loading ? "..." : `${evenements.length}+`, label: "événements" },
                { num: "14", label: "catégories" },
                { num: "Gratuit", label: "à utiliser" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col">
                  <span className="font-black text-2xl text-gray-900 leading-none" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -1 }}>{s.num}</span>
                  <span className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-3 flex-shrink-0">
            {heroCards.map((card, i) => (
              <div key={i} onClick={() => (card as any).id && router.push(`/evenement/${(card as any).id}`)} className="bg-white border-2 border-gray-900 rounded-2xl p-3 flex items-center gap-3 min-w-[264px] cursor-pointer transition-all hover:-translate-y-1" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
                <div className="w-11 h-11 rounded-xl border-2 border-gray-900 flex items-center justify-center text-2xl flex-shrink-0 bg-gray-50">{card.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm truncate" style={{ fontFamily: "'Syne', sans-serif" }}>{card.titre}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{card.ville} · {card.heure}</div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border-2 flex-shrink-0" style={card.tagStyle}>{card.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALENDRIER MOBILE */}
      {showCalendrier && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCalendrier(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
            <MiniCalendrier evenements={evenements.filter(e => new Date(e.quand) >= today)} jourActif={jourActif} setJourActif={setJourActif}/>
            <button onClick={() => setShowCalendrier(false)} className="mt-3 w-72 bg-white text-gray-600 py-2.5 rounded-2xl text-sm font-semibold shadow-lg">Fermer ✕</button>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <section className="bg-white border-b border-gray-100 px-4 sm:px-6 pt-4 pb-3">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center" style={{ scrollbarWidth: "none" }}>
            {filtresBoutons.map((f) => (
              <button key={f.value} onClick={() => { setJourActif(f.value); setShowCalendrier(false) }} className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border-2"
                style={{ background: jourActif === f.value ? "#FF4D00" : "#fff", color: jourActif === f.value ? "#fff" : "#555", borderColor: jourActif === f.value ? "#FF4D00" : "#e5e5e5" }}>
                {f.label}
              </button>
            ))}
            <div className="w-px flex-shrink-0 bg-gray-200 mx-1 self-stretch"/>
            <button onClick={() => setShowCalendrier(!showCalendrier)} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border-2"
              style={{ background: isAgendaActif ? "#FF4D00" : "#fff", color: isAgendaActif ? "#fff" : "#555", borderColor: isAgendaActif ? "#FF4D00" : "#e5e5e5" }}>
              📅 <span>{jourActif !== "tout" && jourActif !== "weekend" && jourActif !== dates.today && jourActif !== dates.demain ? new Date(jourActif).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "Agenda"}</span>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <button key={cat.label} onClick={() => setCategorieActive(cat.label)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2"
                style={{ background: categorieActive === cat.label ? "#FF4D00" : "#fff", color: categorieActive === cat.label ? "#fff" : "#555", borderColor: categorieActive === cat.label ? "#FF4D00" : "#e5e5e5" }}>
                <span className="text-base leading-none">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0"/>
            {!filtreProximite ? (
              <button onClick={activerGeolocalisation} disabled={loadingGeo} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border-2 transition-all disabled:opacity-50" style={{ background: "#DBEAFE", color: "#1e3a5f", borderColor: "#93c5fd" }}>
                {loadingGeo ? "⏳" : "📍"} Près de moi
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0 rounded-full px-3 py-2 border-2" style={{ background: "#DBEAFE", borderColor: "#93c5fd" }}>
                <span className="text-xs font-bold text-blue-800 whitespace-nowrap">📍 {rayon} km</span>
                <input type="range" min="5" max="200" step="5" value={rayon} onChange={(e) => setRayon(Number(e.target.value))} className="w-20"/>
                <button onClick={desactiverGeolocalisation} className="text-blue-400 hover:text-blue-700 text-sm font-bold">✕</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LAYOUT PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6 items-start">
        {showCalendrier && (
          <div className="hidden lg:block flex-shrink-0 sticky top-24">
            <MiniCalendrier evenements={evenements.filter(e => new Date(e.quand) >= today)} jourActif={jourActif} setJourActif={setJourActif}/>
            {jourActif !== "tout" && jourActif !== "weekend" && (
              <div className="mt-3 rounded-2xl p-3 border border-orange-100 w-72" style={{ background: "#FFF7ED" }}>
                <p className="text-xs font-semibold" style={{ color: "#FF4D00" }}>📅 {new Date(jourActif).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="text-xs text-orange-400 mt-1">{evenementsFiltres.length} événement{evenementsFiltres.length > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-5">
            <span className="font-black text-3xl text-gray-900 leading-none" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -1 }}>{loading ? "..." : evenementsFiltres.length}</span>
            <span className="text-sm font-medium text-gray-500">
              événement{evenementsFiltres.length > 1 ? "s" : ""}
              {filtreProximite && position && <span className="text-blue-500 ml-1">· {rayon} km</span>}
              {jourActif === "weekend" && <span className="text-gray-400 ml-1">· Ce week-end</span>}
              {jourActif !== "tout" && jourActif !== "weekend" && jourActif !== dates.today && jourActif !== dates.demain && <span className="text-gray-400 ml-1">· {new Date(jourActif).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>}
            </span>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
                  <div className="h-36 bg-gray-100"/>
                  <div className="p-3 space-y-2"><div className="h-3 bg-gray-100 rounded-full w-1/2"/><div className="h-4 bg-gray-100 rounded-full w-3/4"/><div className="h-3 bg-gray-100 rounded-full w-1/2"/></div>
                </div>
              ))}
            </div>
          ) : evenementsFiltres.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">😕</p>
              <p className="text-lg font-black text-gray-700 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Aucun événement trouvé</p>
              <p className="text-sm text-gray-400 mb-4">Essaie de modifier tes filtres</p>
              {filtreProximite && <button onClick={() => setRayon(r => Math.min(r + 25, 200))} className="mt-2 px-5 py-2.5 text-white rounded-full text-sm font-bold border-2 border-gray-900" style={{ background: "#FF4D00", boxShadow: "3px 3px 0 #1a1a1a" }}>Élargir → {rayon + 25} km</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {evenementsFiltres.map((e) => (
                <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)} className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] border-2 border-gray-900" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
                  <div className="relative h-36 overflow-hidden">
                    {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/> : <div className={`${e.couleur} w-full h-full flex items-center justify-center text-5xl`}>{e.emoji}</div>}
                    <button onClick={(ev) => toggleFavori(ev, e.id)} className="absolute top-2.5 right-2.5 w-8 h-8 bg-white border-2 border-gray-900 rounded-full flex items-center justify-center text-sm hover:scale-110 transition-transform z-10">
                      {favoris.includes(e.id) ? "❤️" : "🤍"}
                    </button>
                    <div className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-bold border-2 border-gray-900 ${e.prix === "Gratuit" ? "bg-green-400 text-white" : "bg-white text-gray-900"}`}>
                      {e.prix === "Gratuit" ? "Gratuit" : e.prix}
                    </div>
                  </div>
                  <div className="p-3">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5" style={{ background: "#FFF3C4", color: "#92400e" }}>{e.categorie}</span>
                    <h4 className="font-black text-sm text-gray-900 leading-tight line-clamp-2 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{e.titre}</h4>
                    <p className="text-gray-400 text-xs truncate">
                      {e.ville}{e.quand && <> · <span style={{ color: "#FF4D00", fontWeight: 600 }}>{formatDate(e.quand)}</span></>}{e.heure && <> · {e.heure}</>}
                    </p>
                    {filtreProximite && position && e.lat && e.lng && <p className="text-blue-400 text-xs mt-1 font-medium">📍 {Math.round(getDistance(position.lat, position.lng, e.lat, e.lng))} km</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER VERT FONCÉ */}
      <footer className="mt-8 py-10 px-4 sm:px-6" style={{ background: "#0D2B1D" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-black text-white text-lg mb-2" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -1 }}>
                Sorties<span style={{ color: "#FF4D00" }}>App</span>
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6EE7B7" }}>Trouve des activités et événements près de chez toi. La vie est trop courte pour s'ennuyer.</p>
            </div>
            <div>
              <h4 className="font-bold text-xs text-white mb-3 tracking-widest uppercase">Navigation</h4>
              <div className="flex flex-col gap-2">
                {[{ l: "Accueil", p: "/" }, { l: "Carte", p: "/carte" }, { l: "Publier", p: "/publier" }, { l: "Tarifs", p: "/tarifs" }].map(x => (
                  <button key={x.l} onClick={() => router.push(x.p)} className="text-sm text-left transition-colors" style={{ color: "#6EE7B7" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#FF4D00"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6EE7B7"}
                  >{x.l}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs text-white mb-3 tracking-widest uppercase">Support</h4>
              <div className="flex flex-col gap-2">
                {[{ l: "Contact", p: "/contact" }, { l: "Remboursement", p: "/contact" }, { l: "Signaler", p: "/contact" }].map(x => (
                  <button key={x.l} onClick={() => router.push(x.p)} className="text-sm text-left transition-colors" style={{ color: "#6EE7B7" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#FF4D00"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6EE7B7"}
                  >{x.l}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs text-white mb-3 tracking-widest uppercase">Partenaires</h4>
              <div className="flex flex-col gap-2">
                {[{ l: "Partenariat local", p: "/contact" }, { l: "Affiliation", p: "/contact" }, { l: "Publicité", p: "/contact" }].map(x => (
                  <button key={x.l} onClick={() => router.push(x.p)} className="text-sm text-left transition-colors" style={{ color: "#6EE7B7" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#FF4D00"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6EE7B7"}
                  >{x.l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: "1px solid #1A4D36" }}>
            <p className="text-xs" style={{ color: "#4ADE80" }}>© 2026 SortiesApp. Tous droits réservés.</p>
            <div className="flex gap-4">
              {[{ l: "Mentions légales", p: "/mentions-legales" }, { l: "CGU", p: "/cgu" }, { l: "Contact", p: "/contact" }].map(x => (
                <button key={x.l} onClick={() => router.push(x.p)} className="text-xs transition-colors" style={{ color: "#4ADE80" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#FF4D00"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#4ADE80"}
                >{x.l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAV */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-900 z-40">
        <div className="flex items-center justify-around px-2 py-2">
          <button onClick={() => router.push("/")} className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold" style={{ color: "#FF4D00" }}>Accueil</span>
          </button>
          <button onClick={() => router.push("/carte")} className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <span className="text-xl">🗺️</span>
            <span className="text-[10px] font-semibold text-gray-400">Carte</span>
          </button>
          <button onClick={() => router.push("/publier")} className="flex flex-col items-center gap-0.5 -mt-5">
            <span className="w-14 h-14 flex items-center justify-center text-white text-2xl font-black rounded-2xl border-2 border-gray-900" style={{ background: "#FF4D00", boxShadow: "3px 3px 0 #1a1a1a" }}>+</span>
          </button>
          <button onClick={() => user ? router.push("/dashboard") : router.push("/auth")} className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <span className="text-xl">❤️</span>
            <span className="text-[10px] font-semibold text-gray-400">Favoris</span>
          </button>
          <button onClick={() => user ? router.push("/dashboard") : router.push("/auth")} className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-semibold text-gray-400">{user ? "Moi" : "Connexion"}</span>
          </button>
        </div>
      </nav>
      <div className="sm:hidden h-20"/>
    </main>
  )
}