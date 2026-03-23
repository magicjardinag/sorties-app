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

const SLIDES = [
  { categorie: "Musique",        emoji: "🎵", bg: "#FF5722", slogan: "La musique, c'est la vie." },
  { categorie: "Sport",          emoji: "🏃", bg: "#7C3AED", slogan: "Ton canapé t'attend pas." },
  { categorie: "Nature & Rando", emoji: "🌿", bg: "#059669", slogan: "L'air frais, ça change tout." },
  { categorie: "Culture",        emoji: "🎨", bg: "#D97706", slogan: "Cultive-toi, ça coûte rien." },
  { categorie: "Food",           emoji: "🍕", bg: "#E11D48", slogan: "On mange bien par ici." },
  { categorie: "Danse",          emoji: "💃", bg: "#DB2777", slogan: "Tes pieds ont envie de bouger." },
  { categorie: "Bar & Nuit",     emoji: "🍸", bg: "#1D4ED8", slogan: "La nuit commence ici." },
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 w-72">
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

// ── HERO avec carrousel intégré ──
function Hero({ evenements, onCategorieChange, recherche, setRecherche, loading }: {
  evenements: Evenement[]
  onCategorieChange: (cat: string) => void
  recherche: string
  setRecherche: (v: string) => void
  loading: boolean
}) {
  const [cur, setCur] = useState(0)
  const [sloganOut, setSloganOut] = useState(false)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dragRef = useRef<number | null>(null)
  const N = SLIDES.length
  const today = new Date(); today.setHours(0,0,0,0)

  const slideEvents = evenements
    .filter(e => e.categorie === SLIDES[cur].categorie && new Date(e.quand) >= today)
    .sort((a, b) => new Date(a.quand).getTime() - new Date(b.quand).getTime())
    .slice(0, 3)

  function goTo(idx: number) {
    const next = ((idx % N) + N) % N
    setSloganOut(true)
    setTimeout(() => {
      setCur(next)
      onCategorieChange(SLIDES[next].categorie)
      setSloganOut(false)
    }, 300)
  }

  function startAuto() {
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = setInterval(() => setCur(c => {
      const next = (c + 1) % N
      setSloganOut(true)
      setTimeout(() => { setCur(next); onCategorieChange(SLIDES[next].categorie); setSloganOut(false) }, 300)
      return c
    }), 3500)
  }

  useEffect(() => { startAuto(); return () => { if (autoRef.current) clearInterval(autoRef.current) } }, [])

  function onDragStart(x: number) { dragRef.current = x; if (autoRef.current) clearInterval(autoRef.current) }
  function onDragEnd(x: number) {
    if (dragRef.current === null) return
    const diff = x - dragRef.current; dragRef.current = null
    if (Math.abs(diff) > 40) goTo(diff < 0 ? cur + 1 : cur - 1)
    startAuto()
  }

  const slide = SLIDES[cur]
  const prevSlide = SLIDES[((cur - 1) + N) % N]
  const nextSlide = SLIDES[(cur + 1) % N]

  return (
    <section style={{ background: slide.bg, transition: "background 0.6s ease" }} className="relative overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)` }}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

          {/* ── GAUCHE : carrousel ── */}
          <div
            className="flex-shrink-0 flex items-center gap-3 select-none"
            style={{ cursor: "grab" }}
            onMouseDown={e => onDragStart(e.clientX)}
            onMouseUp={e => onDragEnd(e.clientX)}
            onTouchStart={e => onDragStart(e.touches[0].clientX)}
            onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
          >
            {/* Carte précédente (ghost) */}
            <div className="hidden sm:block opacity-30 scale-90 transition-all duration-500 cursor-pointer" onClick={() => goTo(cur - 1)}>
              <div className="w-20 h-28 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-white/30" style={{ background: "rgba(255,255,255,0.15)" }}>
                <span style={{ fontSize: 28 }}>{prevSlide.emoji}</span>
                <span className="text-white text-[10px] font-bold text-center px-1">{prevSlide.categorie}</span>
              </div>
            </div>

            {/* Carte active */}
            <div className="relative w-44 h-56 sm:w-52 sm:h-64 rounded-3xl overflow-hidden border-4 border-white/40 shadow-2xl transition-all duration-500"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                <span style={{ fontSize: 72, filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))", lineHeight: 1 }}>{slide.emoji}</span>
                <p className="text-white font-black text-xl text-center" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{slide.categorie}</p>
                <div className="flex gap-1 mt-1">
                  {SLIDES.map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i) }}
                      style={{ width: i === cur ? 20 : 6, height: 6, borderRadius: 3, background: i === cur ? "white" : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", transition: "all .3s" }}/>
                  ))}
                </div>
              </div>
              {/* Flèches */}
              <button onClick={e => { e.stopPropagation(); goTo(cur - 1) }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm" style={{ background: "rgba(0,0,0,0.2)" }}>‹</button>
              <button onClick={e => { e.stopPropagation(); goTo(cur + 1) }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm" style={{ background: "rgba(0,0,0,0.2)" }}>›</button>
            </div>

            {/* Carte suivante (ghost) */}
            <div className="hidden sm:block opacity-30 scale-90 transition-all duration-500 cursor-pointer" onClick={() => goTo(cur + 1)}>
              <div className="w-20 h-28 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-white/30" style={{ background: "rgba(255,255,255,0.15)" }}>
                <span style={{ fontSize: 28 }}>{nextSlide.emoji}</span>
                <span className="text-white text-[10px] font-bold text-center px-1">{nextSlide.categorie}</span>
              </div>
            </div>
          </div>

          {/* ── DROITE : slogan + events + search ── */}
          <div className="flex-1 min-w-0 text-white">

            {/* Slogan animé */}
            <div className="mb-6 overflow-hidden">
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                {slide.categorie} · en ce moment
              </p>
              <h1
                className="font-black leading-tight transition-all duration-300"
                style={{
                  fontSize: "clamp(28px, 4.5vw, 52px)",
                  letterSpacing: "-1.5px",
                  opacity: sloganOut ? 0 : 1,
                  transform: sloganOut ? "translateY(-12px)" : "translateY(0)",
                  textShadow: "0 2px 16px rgba(0,0,0,0.2)",
                }}
              >
                {slide.slogan}
              </h1>
            </div>

            {/* Événements de la catégorie */}
            {slideEvents.length > 0 && (
              <div className="flex flex-col gap-2 mb-6">
                {slideEvents.map(e => (
                  <div key={e.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                    <span className="text-xl flex-shrink-0">{e.emoji || slide.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{e.titre}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>{e.ville} · {formatDate(e.quand)}{e.heure ? ` · ${e.heure}` : ""}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: e.prix === "Gratuit" ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.2)", color: "white" }}>
                      {e.prix === "Gratuit" ? "Gratuit" : e.prix}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {slideEvents.length === 0 && !loading && (
              <div className="mb-6 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.15)" }}>
                <p className="text-sm text-white/80">Pas encore d'événements dans cette catégorie — <span className="font-bold text-white">sois le premier à en publier !</span></p>
              </div>
            )}

            {/* Barre de recherche */}
            <div className="flex items-center bg-white rounded-full px-4 py-2 gap-3 max-w-lg shadow-lg">
              <span className="text-gray-400">🔍</span>
              <input type="text" placeholder="Un concert, une rando, une soirée..." className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400 py-1" value={recherche} onChange={(e) => setRecherche(e.target.value)}/>
              <button className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold text-white" style={{ background: slide.bg }}>Go →</button>
            </div>
          </div>
        </div>
      </div>
    </section>
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
  const isAgendaActif = showCalendrier || (jourActif !== "tout" && jourActif !== "weekend" && jourActif !== dates.today && jourActif !== dates.demain)

  const filtresBoutons = [
    { label: "Tous", value: "tout" },
    { label: "Aujourd'hui", value: dates.today },
    { label: "Demain", value: dates.demain },
    { label: "Ce week-end", value: "weekend" },
  ]

  return (
    <main className="min-h-screen" style={{ background: "#F7F6F2" }}>

      {/* HEADER */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button onClick={() => router.push("/")} className="flex-shrink-0 font-black text-xl tracking-tight text-gray-900">
            Sorties<span style={{ color: "#FF4D00" }}>App</span>
          </button>
          <div className="hidden sm:flex flex-1 max-w-md items-center bg-gray-100 rounded-full px-4 py-2.5 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Événement, ville..." className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400 font-medium" value={recherche} onChange={(e) => setRecherche(e.target.value)}/>
            {recherche && <button onClick={() => setRecherche("")} className="text-gray-400 text-sm">✕</button>}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => { const q = new URLSearchParams(); if (filtreProximite && position) { q.set("lat", position.lat.toString()); q.set("lng", position.lng.toString()); q.set("rayon", rayon.toString()) } if (categorieActive !== "Tout") q.set("categorie", categorieActive); router.push(`/carte?${q.toString()}`) }} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">🗺️ <span className="hidden md:inline">Carte</span></button>
            {user?.email === ADMIN_EMAIL && <button onClick={() => router.push("/admin")} className="px-3 py-2 rounded-full text-sm font-medium text-red-500 hover:bg-red-50">⚙️</button>}
            {user ? <button onClick={() => router.push("/dashboard")} className="px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">Mon espace</button>
              : <button onClick={() => router.push("/auth")} className="px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">Se connecter</button>}
            <button onClick={() => router.push("/publier")} className="px-4 py-2 rounded-full text-sm font-bold text-white shadow-sm" style={{ background: "#FF4D00" }}>+ Publier</button>
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={() => router.push("/carte")} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-base">🗺️</button>
            <button onClick={() => setMenuMobileOpen(!menuMobileOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-base">☰</button>
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
        <div className="border-b border-amber-100 px-4 py-2.5 flex items-center justify-between gap-3" style={{ background: "#FFFBEB" }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold text-amber-700" style={{ background: "#FDE68A" }}>Pub</span>
            <span className="text-sm font-semibold text-gray-800 truncate">{pubActuel.nom_commerce}</span>
            <span className="text-sm text-amber-700 hidden sm:inline truncate">{pubActuel.description}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={pubActuel.lien} target="_blank" className="text-xs font-semibold hover:underline whitespace-nowrap" style={{ color: "#FF4D00" }}>Voir →</a>
            <div className="flex gap-1">{pubsFiltrees.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === pubIndex % pubsFiltrees.length ? "bg-amber-500" : "bg-amber-200"}`}/>)}</div>
          </div>
        </div>
      )}

      {/* HERO */}
      <Hero
        evenements={evenements}
        onCategorieChange={setCategorieActive}
        recherche={recherche}
        setRecherche={setRecherche}
        loading={loading}
      />

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
      <section id="grille-evenements" className="bg-white border-b border-gray-100 px-4 sm:px-6 pt-4 pb-3">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center" style={{ scrollbarWidth: "none" }}>
            {filtresBoutons.map((f) => (
              <button key={f.value} onClick={() => { setJourActif(f.value); setShowCalendrier(false) }} className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border"
                style={{ background: jourActif === f.value ? "#FF4D00" : "#fff", color: jourActif === f.value ? "#fff" : "#555", borderColor: jourActif === f.value ? "#FF4D00" : "#e5e5e5" }}>
                {f.label}
              </button>
            ))}
            <div className="w-px flex-shrink-0 bg-gray-200 mx-1 self-stretch"/>
            <button onClick={() => setShowCalendrier(!showCalendrier)} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border"
              style={{ background: isAgendaActif ? "#FF4D00" : "#fff", color: isAgendaActif ? "#fff" : "#555", borderColor: isAgendaActif ? "#FF4D00" : "#e5e5e5" }}>
              📅 <span>{jourActif !== "tout" && jourActif !== "weekend" && jourActif !== dates.today && jourActif !== dates.demain ? new Date(jourActif).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "Agenda"}</span>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <button key={cat.label} onClick={() => setCategorieActive(cat.label)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border"
                style={{ background: categorieActive === cat.label ? "#FF4D00" : "#fff", color: categorieActive === cat.label ? "#fff" : "#555", borderColor: categorieActive === cat.label ? "#FF4D00" : "#e5e5e5" }}>
                <span className="text-base leading-none">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0"/>
            {!filtreProximite ? (
              <button onClick={activerGeolocalisation} disabled={loadingGeo} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border transition-all disabled:opacity-50" style={{ background: "#EFF6FF", color: "#1e40af", borderColor: "#bfdbfe" }}>
                {loadingGeo ? "⏳" : "📍"} Près de moi
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0 rounded-full px-3 py-2 border" style={{ background: "#EFF6FF", borderColor: "#bfdbfe" }}>
                <span className="text-xs font-semibold text-blue-800 whitespace-nowrap">📍 {rayon} km</span>
                <input type="range" min="5" max="200" step="5" value={rayon} onChange={(e) => setRayon(Number(e.target.value))} className="w-20"/>
                <button onClick={desactiverGeolocalisation} className="text-blue-400 hover:text-blue-700 text-sm">✕</button>
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
            <span className="font-black text-2xl text-gray-900 leading-none">{loading ? "..." : evenementsFiltres.length}</span>
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
              <p className="text-lg font-bold text-gray-700 mb-1">Aucun événement trouvé</p>
              <p className="text-sm text-gray-400 mb-4">Essaie de modifier tes filtres</p>
              {filtreProximite && <button onClick={() => setRayon(r => Math.min(r + 25, 200))} className="mt-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold shadow-sm" style={{ background: "#FF4D00" }}>Élargir → {rayon + 25} km</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {evenementsFiltres.map((e) => (
                <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)} className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] border border-gray-200 shadow-sm">
                  <div className="relative h-36 overflow-hidden">
                    {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/> : <div className={`${e.couleur} w-full h-full flex items-center justify-center text-5xl`}>{e.emoji}</div>}
                    <button onClick={(ev) => toggleFavori(ev, e.id)} className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-sm hover:scale-110 transition-transform z-10 shadow-sm">
                      {favoris.includes(e.id) ? "❤️" : "🤍"}
                    </button>
                    <div className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${e.prix === "Gratuit" ? "bg-green-500 text-white" : "bg-white/90 text-gray-800"}`}>
                      {e.prix === "Gratuit" ? "Gratuit" : e.prix}
                    </div>
                  </div>
                  <div className="p-3">
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5" style={{ background: "#FEF3C7", color: "#92400e" }}>{e.categorie}</span>
                    <h4 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 mb-1">{e.titre}</h4>
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

      {/* FOOTER */}
      <footer className="mt-8 py-10 px-4 sm:px-6" style={{ background: "#1E2A3A" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-black text-white text-lg mb-2">Sorties<span style={{ color: "#FF4D00" }}>App</span></h3>
              <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>Trouve des activités et événements près de chez toi. La vie est trop courte pour s'ennuyer.</p>
            </div>
            <div>
              <h4 className="font-semibold text-xs mb-3 tracking-widest uppercase" style={{ color: "#64748B" }}>Navigation</h4>
              <div className="flex flex-col gap-2">
                {[{ l: "Accueil", p: "/" }, { l: "Carte", p: "/carte" }, { l: "Publier", p: "/publier" }, { l: "Tarifs", p: "/tarifs" }].map(x => (
                  <button key={x.l} onClick={() => router.push(x.p)} className="text-sm text-left transition-colors" style={{ color: "#94A3B8" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#FF4D00"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#94A3B8"}>{x.l}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-xs mb-3 tracking-widest uppercase" style={{ color: "#64748B" }}>Support</h4>
              <div className="flex flex-col gap-2">
                {[{ l: "Contact", p: "/contact" }, { l: "Remboursement", p: "/contact" }, { l: "Signaler", p: "/contact" }].map(x => (
                  <button key={x.l} onClick={() => router.push(x.p)} className="text-sm text-left transition-colors" style={{ color: "#94A3B8" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#FF4D00"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#94A3B8"}>{x.l}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-xs mb-3 tracking-widest uppercase" style={{ color: "#64748B" }}>Partenaires</h4>
              <div className="flex flex-col gap-2">
                {[{ l: "Partenariat local", p: "/contact" }, { l: "Affiliation", p: "/contact" }, { l: "Publicité", p: "/contact" }].map(x => (
                  <button key={x.l} onClick={() => router.push(x.p)} className="text-sm text-left transition-colors" style={{ color: "#94A3B8" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#FF4D00"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#94A3B8"}>{x.l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-700">
            <p className="text-xs" style={{ color: "#475569" }}>© 2026 SortiesApp. Tous droits réservés.</p>
            <div className="flex gap-4">
              {[{ l: "Mentions légales", p: "/mentions-legales" }, { l: "CGU", p: "/cgu" }, { l: "Contact", p: "/contact" }].map(x => (
                <button key={x.l} onClick={() => router.push(x.p)} className="text-xs transition-colors" style={{ color: "#475569" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#FF4D00"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#475569"}>{x.l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAV */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
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
            <span className="w-14 h-14 flex items-center justify-center text-white text-2xl font-black rounded-2xl shadow-lg" style={{ background: "#FF4D00" }}>+</span>
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