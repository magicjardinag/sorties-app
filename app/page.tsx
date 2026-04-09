"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { track } from "@/lib/analytics"

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

const HERO_SLIDES = [
  { categorie: "Musique", emoji: "🎵", bg: "#7C3AED", accent: "#f3f4f6", phrase: "Tes oreilles méritent mieux que Spotify.", sub: "Musique · en ce moment" },
  { categorie: "Sport", emoji: "🏃", bg: "#059669", accent: "#f3f4f6", phrase: "Ton canapé survivra sans toi ce soir.", sub: "Sport · en ce moment" },
  { categorie: "Nature & Rando", emoji: "🌿", bg: "#0891B2", accent: "#f3f4f6", phrase: "La nature existe aussi en vrai, paraît-il.", sub: "Nature & Rando · en ce moment" },
  { categorie: "Culture", emoji: "🎨", bg: "#D97706", accent: "#f3f4f6", phrase: "Sors, t'auras l'air cultivé au bureau lundi.", sub: "Culture · en ce moment" },
  { categorie: "Food", emoji: "🍕", bg: "#DC2626", accent: "#f3f4f6", phrase: "Tu peux pas manger pareil chez toi. Promis.", sub: "Food · en ce moment" },
  { categorie: "Danse", emoji: "💃", bg: "#DB2777", accent: "#f3f4f6", phrase: "Personne juge. Enfin presque.", sub: "Danse · en ce moment" },
  { categorie: "Bar & Nuit", emoji: "🍸", bg: "#1D4ED8", accent: "#f3f4f6", phrase: "Un verre dehors, ça compte comme du social.", sub: "Bar & Nuit · en ce moment" },
  { categorie: "Atelier", emoji: "🛠️", bg: "#B45309", accent: "#f3f4f6", phrase: "Crée un truc. Même raté c'est sympa.", sub: "Atelier · en ce moment" },
  { categorie: "Enfants", emoji: "🧒", bg: "#0EA5E9", accent: "#f3f4f6", phrase: "Épuise-les dehors. Dors mieux ce soir.", sub: "Enfants · en ce moment" },
  { categorie: "Animaux", emoji: "🐾", bg: "#16A34A", accent: "#f3f4f6", phrase: "Ton chien a besoin de toi. (C'est lui qui le dit.)", sub: "Animaux · en ce moment" },
  { categorie: "Brocante", emoji: "🏺", bg: "#92400E", accent: "#f3f4f6", phrase: "Achète des trucs dont t'as pas besoin. Avec style.", sub: "Brocante · en ce moment" },
  { categorie: "Loto", emoji: "🎰", bg: "#BE185D", accent: "#f3f4f6", phrase: "Ce soir c'est peut-être toi. (C'est pas toi.)", sub: "Loto · en ce moment" },
]

const FALLBACK_PHOTOS_POOL: Record<string, string[]> = {
  "Musique": [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80",
    "https://images.unsplash.com/photo-1540039155733-5bb30b4f5bdc?w=600&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80",
  ],
  "Sport": [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80",
    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80",
    "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&q=80",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
    "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&q=80",
  ],
  "Danse": [
    "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&q=80",
    "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&q=80",
    "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&q=80",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80",
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&q=80",
    "https://images.unsplash.com/photo-1562088287-bde35a1ea917?w=600&q=80",
    "https://images.unsplash.com/photo-1578763363228-6e8428de69b2?w=600&q=80",
  ],
  "Culture": [
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80",
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80",
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80",
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80",
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80",
  ],
  "Atelier": [
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80",
    "https://images.unsplash.com/photo-1459183885421-5cc683b8dbba?w=600&q=80",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80",
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80",
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80",
  ],
  "Food": [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80",
    "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
  ],
  "Nature & Rando": [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=600&q=80",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80",
    "https://images.unsplash.com/photo-1510797215324-95aa89f43c33?w=600&q=80",
    "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=600&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  ],
  "Animaux": [
    "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80",
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&q=80",
    "https://images.unsplash.com/photo-1444212477490-ca407925329e?w=600&q=80",
    "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=600&q=80",
    "https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600&q=80",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80",
    "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=600&q=80",
    "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600&q=80",
  ],
  "Brocante": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80",
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80",
    "https://images.unsplash.com/photo-1567767292278-a3e6b3dba866?w=600&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80",
    "https://images.unsplash.com/photo-1524117074681-31bd4de22ad3?w=600&q=80",
    "https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=600&q=80",
    "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&q=80",
  ],
  "Bar & Nuit": [
    "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&q=80",
    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80",
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80",
    "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=600&q=80",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80",
  ],
  "Loto": [
    "https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=600&q=80",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80",
    "https://images.unsplash.com/photo-1547226706-6f51c0a87af9?w=600&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
  ],
  "Enfants": [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80",
    "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=600&q=80",
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&q=80",
    "https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=600&q=80",
    "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80",
  ],
  "Gratuit": [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80",
    "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=600&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
  ],
}
function getFallbackPhoto(categorie: string, seed?: string): string {
  const pool = FALLBACK_PHOTOS_POOL[categorie] || FALLBACK_PHOTOS_POOL["Gratuit"]
  if (!seed) return pool[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) { hash = ((hash << 5) - hash) + seed.charCodeAt(i); hash |= 0 }
  return pool[Math.abs(hash) % pool.length]
}

type Evenement = {
  id: string; titre: string; categorie: string; ville: string; quand: string
  heure: string; prix: string; emoji: string; couleur: string; organisateur: string
  description: string; image_url: string; lat: number; lng: number
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2-lat1)*Math.PI/180; const dLng = (lng2-lng1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const today = new Date(); today.setHours(0,0,0,0)
  const eventDate = new Date(dateStr); eventDate.setHours(0,0,0,0)
  const diffDays = Math.round((eventDate.getTime()-today.getTime())/(1000*60*60*24))
  if (diffDays < 0) return "passé"
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Demain"
  if (diffDays <= 6) return ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][new Date(dateStr).getDay()]
  return new Date(dateStr).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})
}

function getFiltreDates() {
  const today = new Date(); today.setHours(0,0,0,0)
  const demain = new Date(today); demain.setDate(today.getDate()+1)
  const jourSemaine = today.getDay()
  const samedi = new Date(today); samedi.setDate(today.getDate()+(jourSemaine===6?0:6-jourSemaine))
  const dimanche = new Date(samedi); dimanche.setDate(samedi.getDate()+1)
  return { today: today.toISOString().split("T")[0], demain: demain.toISOString().split("T")[0], samedi: samedi.toISOString().split("T")[0], dimanche: dimanche.toISOString().split("T")[0] }
}


function MiniCalendrier({ evenements, jourActif, setJourActif }: {
  evenements: Evenement[]
  jourActif: string
  setJourActif: (d: string) => void
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [moisActuel, setMoisActuel] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const annee = moisActuel.getFullYear()
  const mois = moisActuel.getMonth()
  const premierJour = new Date(annee, mois, 1).getDay()
  const nbJours = new Date(annee, mois + 1, 0).getDate()
  const offset = premierJour === 0 ? 6 : premierJour - 1
  const datesAvecEvenements = new Set(evenements.map(e => e.quand))
  const joursNoms = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]
  const moisNoms = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMoisActuel(new Date(annee, mois - 1, 1))} className="text-gray-400 hover:text-gray-700 text-lg px-1">‹</button>
        <p className="font-bold text-gray-800 text-sm">{moisNoms[mois]} {annee}</p>
        <button onClick={() => setMoisActuel(new Date(annee, mois + 1, 1))} className="text-gray-400 hover:text-gray-700 text-lg px-1">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {joursNoms.map(j => <p key={j} className="text-center text-xs text-gray-400 font-medium py-1">{j}</p>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: nbJours }).map((_, i) => {
          const jour = i + 1
          const dateStr = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`
          const hasEvent = datesAvecEvenements.has(dateStr)
          const isToday = dateStr === today.toISOString().split("T")[0]
          const isSelected = jourActif === dateStr
          const isPast = new Date(dateStr) < today
          return (
            <button key={dateStr} onClick={() => setJourActif(isSelected ? "tout" : dateStr)} disabled={isPast && !hasEvent}
              className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-xs font-medium transition-all
                ${isSelected ? "bg-gray-800 text-white" : isToday ? "bg-gray-100 text-gray-700 font-bold" :
                  isPast ? "text-gray-300 cursor-not-allowed" : hasEvent ? "text-gray-800 hover:bg-gray-50 cursor-pointer" : "text-gray-400 hover:bg-gray-50 cursor-pointer"}`}>
              {jour}
              {hasEvent && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400" />}
            </button>
          )
        })}
      </div>
      {jourActif !== "tout" && (
        <button onClick={() => setJourActif("tout")} className="mt-3 w-full text-xs text-gray-500 hover:underline text-center">Voir tous les événements ×</button>
      )}
    </div>
  )
}

// ── HERO GLASS ──────────────────────────────────────────────────────────
function HeroCarousel({ evenements, recherche, setRecherche }: { evenements: Evenement[]; recherche: string; setRecherche: (v: string) => void }) {
  const [cur, setCur] = useState(0)
  const [phraseVisible, setPhraseVisible] = useState(true)
  const [slideEvents, setSlideEvents] = useState<Evenement[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const autoRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const touchStartX = useRef<number|null>(null)
  const today = new Date(); today.setHours(0,0,0,0)
  const N = HERO_SLIDES.length

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check(); window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const pool = evenements.filter(e => e.categorie === HERO_SLIDES[cur].categorie && new Date(e.quand) >= today)
    const shuffled = [...pool].sort(() => Math.random()-0.5)
    setSlideEvents(shuffled.slice(0, Math.max(Math.min(shuffled.length, Math.floor(Math.random()*3)+1), 1)))
  }, [evenements, cur])

  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = setInterval(() => { setPhraseVisible(false); setTimeout(() => { setCur(c => (c+1)%N); setPhraseVisible(true) }, 200) }, 4500)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [cur])

  function goTo(idx: number) {
    setPhraseVisible(false)
    setTimeout(() => { setCur(((idx%N)+N)%N); setPhraseVisible(true) }, 200)
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = setInterval(() => { setPhraseVisible(false); setTimeout(() => { setCur(c => (c+1)%N); setPhraseVisible(true) }, 200) }, 4500)
  }

  const slide = HERO_SLIDES[cur]

  return (
    <section className="relative w-full overflow-hidden" style={{ background: slide.bg }}>
      {/* Motif décoratif subtil */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(0,0,0,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,0,0,0.02) 0%, transparent 40%)" }} />

      {/* MOBILE */}
      {isMobile && (
        <div className="px-4 py-6 relative"
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return
            const diff = touchStartX.current - e.changedTouches[0].clientX
            if (Math.abs(diff) > 50) goTo(diff > 0 ? cur+1 : cur-1)
            touchStartX.current = null
          }}
          style={{ touchAction: "pan-y" }}>

          {/* Label catégorie */}
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 22 }}>{slide.emoji}</span>
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400">{slide.sub}</span>
          </div>

          {/* Slogan */}
          <h2 className="font-black mb-4 hero-phrase" style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(22px, 6.5vw, 32px)",
            letterSpacing: "-0.5px",
            color: "#1a1a2e",
            lineHeight: 1.15,
            opacity: phraseVisible ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}>
            {slide.phrase}
          </h2>

          {/* Events glass cards */}
          <div className="flex flex-col gap-2 mb-4">
            {slideEvents.length > 0 ? slideEvents.map(e => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span style={{ fontSize: 16 }}>{e.emoji || slide.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-gray-900 font-semibold text-xs truncate">{e.titre}</p>
                    <p className="text-xs text-gray-400 truncate">{e.ville}{e.heure ? ` · ${e.heure}` : ""}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ml-2"
                  style={{ background: e.prix === "Gratuit" ? "#22c55e" : "rgba(255,255,255,0.2)", color: "#fff" }}>
                  {e.prix}
                </span>
              </div>
            )) : (
              <div className="rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <p className="text-xs text-gray-400">Aucun événement pour le moment</p>
              </div>
            )}
          </div>

          {/* Dots */}
          <div className="flex gap-1.5 justify-center">
            {HERO_SLIDES.map((_,i) => (
              <button key={i} onClick={() => goTo(i)}
                className="rounded-full transition-all"
                style={{ width: i===cur ? 16 : 6, height: 6, background: i===cur ? "#1a1a2e" : "rgba(0,0,0,0.15)" }} />
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP */}
      {!isMobile && (
        <div className="max-w-7xl mx-auto px-6 py-10 flex items-center gap-8">
          {/* Carrousel catégories */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => goTo(cur-1)}
              className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl cursor-pointer transition-all flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)", minWidth: 80, opacity: 0.5 }}>
              <span style={{ fontSize: 28 }}>{HERO_SLIDES[((cur-1)+N)%N].emoji}</span>
              <span className="text-gray-500 text-xs font-medium text-center" style={{ fontSize: 11 }}>{HERO_SLIDES[((cur-1)+N)%N].categorie.replace(" & Rando","")}</span>
            </button>
            <button onClick={() => goTo(cur-1)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 font-bold flex-shrink-0" style={{ background: "rgba(0,0,0,0.06)", fontSize: 18 }}>‹</button>
            <div className="flex flex-col items-center gap-3 rounded-2xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", padding: "24px 20px", minWidth: 130 }}>
              <span style={{ fontSize: 52 }}>{slide.emoji}</span>
              <span className="text-white font-black text-center leading-tight" style={{ fontSize: 15, fontFamily: "'Syne', sans-serif" }}>{slide.categorie}</span>
              <div className="flex gap-1.5">
                {HERO_SLIDES.map((_,i) => (
                  <button key={i} onClick={() => goTo(i)} className="rounded-full transition-all"
                    style={{ width: i===cur ? 16 : 6, height: 6, background: i===cur ? "#1a1a2e" : "rgba(0,0,0,0.15)" }} />
                ))}
              </div>
            </div>
            <button onClick={() => goTo(cur+1)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 font-bold flex-shrink-0" style={{ background: "rgba(0,0,0,0.06)", fontSize: 18 }}>›</button>
            <button onClick={() => goTo(cur+1)}
              className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl cursor-pointer transition-all flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)", minWidth: 80, opacity: 0.5 }}>
              <span style={{ fontSize: 28 }}>{HERO_SLIDES[(cur+1)%N].emoji}</span>
              <span className="text-gray-500 text-xs font-medium text-center" style={{ fontSize: 11 }}>{HERO_SLIDES[(cur+1)%N].categorie.replace(" & Rando","")}</span>
            </button>
          </div>

          {/* Contenu droit */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold tracking-widest uppercase mb-3 text-gray-400">{slide.sub}</p>
            <h2 className="font-black mb-5" style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 4vw, 52px)",
              letterSpacing: "-1.5px",
              color: "#1a1a2e",
              lineHeight: 1.05,
              opacity: phraseVisible ? 1 : 0,
              transform: phraseVisible ? "translateY(0)" : "translateY(-8px)",
              transition: "opacity .25s ease, transform .25s ease",
            }}>{slide.phrase}</h2>

            <div className="flex flex-col gap-2 mb-5">
              {slideEvents.length > 0 ? slideEvents.map(e => (
                <div key={e.id} className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span style={{ fontSize: 20 }}>{e.emoji || slide.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-gray-900 font-semibold text-sm truncate">{e.titre}</p>
                      <p className="text-xs text-gray-400">{e.ville} · {formatDate(e.quand)}{e.heure ? ` · ${e.heure}` : ""}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ml-3"
                    style={{ background: e.prix === "Gratuit" ? "#22c55e" : "rgba(255,255,255,0.2)", color: "#fff" }}>
                    {e.prix}
                  </span>
                </div>
              )) : (
                <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <p className="text-sm text-gray-400">Aucun événement pour le moment</p>
                </div>
              )}
            </div>

            <div className="flex items-center bg-white rounded-full px-4 py-2 gap-3 max-w-md" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <span className="text-gray-400">🔍</span>
              <input type="text" placeholder="Un concert, une rando, une soirée..."
                className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400 py-1"
                value={recherche} onChange={e => setRecherche(e.target.value)} />
              <button className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold text-white transition-colors"
                style={{ background: "#1a1a2e" }}>Go →</button>
            </div>
          </div>
        </div>
      )}
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
  const [position, setPosition] = useState<{lat:number;lng:number}|null>(null)
  const [rayon, setRayon] = useState(50)
  const [filtreProximite, setFiltreProximite] = useState(false)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [showCalendrier, setShowCalendrier] = useState(false)
  const [menuMobileOpen, setMenuMobileOpen] = useState(false)
  const [showGeoModal, setShowGeoModal] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showGeoSheet, setShowGeoSheet] = useState(false)

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBtn(true) }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setShowInstallBtn(false))
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") { setShowInstallBtn(false); track("install_app", undefined, { outcome: "accepted" }) }
    setInstallPrompt(null)
  }

  const dates = getFiltreDates()

  useEffect(() => {
    const done = localStorage.getItem("onboarding_done")
    if (!done) router.replace("/onboarding")
  }, [])

  // Track recherche (après 1s sans frappe)
  useEffect(() => {
    if (!recherche) return
    const t = setTimeout(() => track("recherche", undefined, { query: recherche }), 1000)
    return () => clearTimeout(t)
  }, [recherche])

  useEffect(() => {
    supabase.from("evenements").select("*").eq("statut","approuve").then(({data,error}) => { if (!error) setEvenements(data||[]); setLoading(false) })
    supabase.auth.getUser().then(({data:{user}}) => { setUser(user); if (user) supabase.from("favoris").select("evenement_id").eq("user_id",user.id).then(({data}) => setFavoris(data?.map((f:any)=>f.evenement_id)||[])) })
    supabase.from("publicites").select("*").eq("actif",true).then(({data}) => setPubs(data||[]))
    if (!localStorage.getItem("geo_asked")) setTimeout(() => setShowGeoModal(true), 1800)
  }, [])

  useEffect(() => {
    const len = (position ? pubs.filter(p => !p.lat||!p.lng) : pubs).length
    if (!len) return
    const i = setInterval(() => setPubIndex(p => (p+1)%Math.max(len,1)), 5000)
    return () => clearInterval(i)
  }, [pubs.length, position])


  const activerGeolocalisation = () => {
    setLoadingGeo(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition({lat:pos.coords.latitude,lng:pos.coords.longitude}); setFiltreProximite(true); setLoadingGeo(false); track("geo_activee") },
      () => { alert("Impossible d'accéder à ta position."); setLoadingGeo(false) }
    )
  }

  const toggleFavori = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!user) { router.push("/auth"); return }
    if (favoris.includes(id)) {
      await supabase.from("favoris").delete().eq("user_id",user.id).eq("evenement_id",id)
      setFavoris(favoris.filter(f => f!==id))
      track("retrait_favori", id)
    } else {
      await supabase.from("favoris").insert({user_id:user.id,evenement_id:id})
      setFavoris([...favoris,id])
      track("ajout_favori", id)
    }
  }, [user, favoris])

  const pubsFiltrees = position ? pubs.filter(p => !p.lat||!p.lng||getDistance(position.lat,position.lng,p.lat,p.lng)<=(p.rayon||50)) : pubs
  const today = new Date(); today.setHours(0,0,0,0)

  const evenementsFiltres = evenements.filter(e => {
    const matchCat = categorieActive==="Tout"||(categorieActive==="Gratuit"?e.prix==="Gratuit":e.categorie===categorieActive)
    const matchSearch = e.titre.toLowerCase().includes(recherche.toLowerCase())||e.ville.toLowerCase().includes(recherche.toLowerCase())
    const matchProx = !filtreProximite||!position||!e.lat||!e.lng||getDistance(position.lat,position.lng,e.lat,e.lng)<=rayon
    const matchDate = !e.quand||new Date(e.quand)>=today
    const matchJour = jourActif==="tout"?true:jourActif==="weekend"?(e.quand===dates.samedi||e.quand===dates.dimanche):e.quand===jourActif
    return matchCat&&matchSearch&&matchProx&&matchDate&&matchJour
  }).sort((a,b) => new Date(a.quand).getTime()-new Date(b.quand).getTime())

  const pubActuel = pubsFiltrees[pubIndex%Math.max(pubsFiltrees.length,1)]
  const isAgendaActif = showCalendrier||(jourActif!=="tout"&&jourActif!=="weekend"&&jourActif!==dates.today&&jourActif!==dates.demain)
  const filtresBoutons = [{label:"Tous",value:"tout"},{label:"Aujourd'hui",value:dates.today},{label:"Demain",value:dates.demain},{label:"Ce week-end",value:"weekend"}]

  // 14 prochains jours pour le sélecteur horizontal
  const prochainsjours = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().split("T")[0]
    const joursNoms = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    const moisNoms = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"]
    return {
      dateStr,
      jourNom: i === 0 ? "Auj." : i === 1 ? "Dem." : joursNoms[d.getDay()],
      jourNum: d.getDate(),
      mois: moisNoms[d.getMonth()],
    }
  })

  // Couleur accent neutre
  const ACCENT = "#1a1a2e"

  return (
    <main className="min-h-screen" style={{ background: "#F7F6F2" }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        html { scroll-behavior: auto; }
        body { overscroll-behavior: none; }
        img { display: block; }
        @media (max-width: 640px) {
          * { transition: none !important; animation: none !important; }
          .hero-phrase { transition: opacity 0.2s ease !important; }
        }
      `}</style>

      {/* HEADER DESKTOP */}
      <header className="hidden sm:block bg-white/90 sticky top-0 z-40 border-b border-gray-100" style={{ backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button onClick={() => router.push("/")} className="flex-shrink-0 font-black text-xl tracking-tight" style={{ color: ACCENT }}>
            Sorties<span style={{ color: "#6b7280" }}>App</span>
          </button>
          <div className="hidden sm:flex flex-1 max-w-md items-center bg-gray-100 rounded-full px-4 py-2.5 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Événement, ville..." className="bg-transparent flex-1 text-sm text-gray-700 outline-none placeholder-gray-400 font-medium" value={recherche} onChange={e => setRecherche(e.target.value)} />
            {recherche && <button onClick={() => setRecherche("")} className="text-gray-400 text-sm">✕</button>}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => { router.push("/carte"); track("clic_carte") }} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">🗺️ Carte</button>
            {user?.email===ADMIN_EMAIL && <button onClick={() => router.push("/admin")} className="px-3 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100">⚙️</button>}
            {user ? <button onClick={() => router.push("/dashboard")} className="px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">Mon espace</button>
              : <button onClick={() => router.push("/auth")} className="px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">Se connecter</button>}
            <button onClick={() => { setShowQRModal(true); track("scan_qr", undefined, { source: "header_desktop" }) }} className="px-4 py-2 rounded-full text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              📲 Installer
            </button>
            <button onClick={() => router.push("/publier")} className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: ACCENT }}>+ Publier</button>
          </div>
        </div>

        {menuMobileOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
            {user ? <button onClick={() => { router.push("/dashboard"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">👤 Mon espace</button>
              : <button onClick={() => { router.push("/auth"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">Se connecter</button>}
            <button onClick={() => { router.push("/tarifs"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">💎 Tarifs</button>
            {user?.email === ADMIN_EMAIL && <button onClick={() => { router.push("/admin"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">⚙️ Admin</button>}
            <button onClick={() => { router.push("/publier"); setMenuMobileOpen(false) }} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white text-center" style={{ background: "#1a1a1a" }}>+ Publier un événement</button>
          </div>
        )}
      </header>

      {/* PUB DESKTOP */}
      {pubsFiltrees.length > 0 && pubActuel && (
        <div className="hidden sm:flex border-b border-gray-100 px-4 py-2 items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold text-gray-500 bg-gray-100">Pub</span>
            <span className="text-sm font-semibold text-gray-700 truncate">{pubActuel.nom_commerce}</span>
            <span className="text-sm text-gray-400 hidden sm:inline truncate">{pubActuel.description}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={pubActuel.lien} target="_blank" onClick={() => track("clic_pub", pubActuel.id, { nom: pubActuel.nom_commerce })} className="text-xs font-semibold text-gray-600 hover:underline">Voir →</a>
          </div>
        </div>
      )}

      {/* HERO */}
      <HeroCarousel evenements={evenements} recherche={recherche} setRecherche={setRecherche} />

      {/* MODALE GÉOLOC */}
      {showGeoModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => { setShowGeoModal(false); localStorage.setItem("geo_asked","1") }}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📍</div>
              <h3 className="font-black text-xl text-gray-900 mb-1">Autour de toi ?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Dis-nous où tu es et on te montre les événements à portée de main.</p>
            </div>
            <button onClick={() => { setShowGeoModal(false); localStorage.setItem("geo_asked","1"); activerGeolocalisation() }}
              className="w-full py-3 rounded-2xl font-bold text-white text-sm mb-3" style={{ background: ACCENT }}>
              📍 Oui, trouve des events près de moi
            </button>
            <button onClick={() => { setShowGeoModal(false); localStorage.setItem("geo_asked","1") }}
              className="w-full py-2.5 rounded-2xl font-semibold text-gray-400 text-sm">
              Non merci, je cherche ailleurs
            </button>
          </div>
        </div>
      )}

      {/* CALENDRIER MOBILE */}
      {showCalendrier && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCalendrier(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
            <MiniCalendrier evenements={evenements.filter(e => new Date(e.quand) >= today)} jourActif={jourActif} setJourActif={setJourActif} />
            <button onClick={() => setShowCalendrier(false)} className="mt-3 w-72 bg-white text-gray-600 py-2.5 rounded-2xl text-sm font-semibold shadow-lg">Fermer ✕</button>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <section className="bg-white border-b border-gray-100 px-4 sm:px-6 pt-3 pb-3">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Sélecteur jours horizontal */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>

              {/* Jours défilants */}
              {prochainsjours.map(j => (
                <button key={j.dateStr} onClick={() => { const next = jourActif===j.dateStr ? "tout" : j.dateStr; setJourActif(next); setShowCalendrier(false); if (next !== "tout") track("filtre_date", undefined, { date: j.dateStr }) }}
                  className="flex-shrink-0 flex flex-col items-center justify-center transition-all"
                  style={{
                    background: jourActif===j.dateStr ? ACCENT : "#fff",
                    color: jourActif===j.dateStr ? "#fff" : "#374151",
                    border: jourActif===j.dateStr ? "none" : "1px solid #e5e7eb",
                    borderRadius: jourActif===j.dateStr ? "20px" : "14px",
                    minWidth: 58,
                    padding: "8px 10px",
                    boxShadow: jourActif===j.dateStr ? "0 4px 12px rgba(26,26,46,0.25)" : "none",
                  }}>
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ opacity: jourActif===j.dateStr ? 1 : 0.5 }}>{j.jourNom}</span>
                  <span className="text-2xl font-black leading-tight">{j.jourNum}</span>
                  <span className="text-[9px]" style={{ opacity: jourActif===j.dateStr ? 0.8 : 0.4 }}>{j.mois}</span>
                </button>
              ))}
            </div>
            {/* Agenda + Géoloc */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setShowCalendrier(!showCalendrier)}
                className="flex-shrink-0 flex flex-col items-center justify-center transition-all"
                style={{
                  background: isAgendaActif ? ACCENT : "#fff",
                  color: isAgendaActif ? "#fff" : "#374151",
                  border: isAgendaActif ? "none" : "1px solid #e5e7eb",
                  borderRadius: isAgendaActif ? "20px" : "14px",
                  minWidth: 58, padding: "8px 10px",
                  boxShadow: isAgendaActif ? "0 4px 12px rgba(26,26,46,0.25)" : "none",
                }}>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ opacity: isAgendaActif ? 1 : 0.5 }}>Cal.</span>
                <span className="text-2xl leading-tight">📅</span>
                <span className="text-[9px]" style={{ opacity: isAgendaActif ? 0.8 : 0.4 }}>agenda</span>
              </button>
              <button onClick={() => setShowGeoSheet(true)}
                className="flex-shrink-0 flex flex-col items-center justify-center transition-all"
                style={{
                  background: filtreProximite ? ACCENT : "#fff",
                  color: filtreProximite ? "#fff" : "#374151",
                  border: filtreProximite ? "none" : "1px solid #e5e7eb",
                  borderRadius: filtreProximite ? "20px" : "14px",
                  minWidth: 58, padding: "8px 10px",
                  boxShadow: filtreProximite ? "0 4px 12px rgba(26,26,46,0.25)" : "none",
                }}>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ opacity: filtreProximite ? 1 : 0.5 }}>Lieu</span>
                <span className="text-2xl leading-tight">📍</span>
                <span className="text-[9px]" style={{ opacity: filtreProximite ? 0.8 : 0.4 }}>{filtreProximite ? `${rayon}km` : "près de moi"}</span>
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center" style={{ scrollbarWidth: "none" }}>
            {categories.map(cat => (
              <button key={cat.label} onClick={() => { setCategorieActive(cat.label); if (cat.label !== "Tout") track("filtre_categorie", undefined, { categorie: cat.label }) }}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap border transition-all"
                style={{ background: categorieActive===cat.label ? ACCENT : "#fff", color: categorieActive===cat.label ? "#fff" : "#555", borderColor: categorieActive===cat.label ? ACCENT : "#e5e5e5", padding: "7px 12px" }}>
                <span style={{ fontSize: 15 }}>{cat.emoji}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* LAYOUT PRINCIPAL */}
      {showCalendrier && (
        <div className="hidden lg:block fixed left-6 top-32 z-30">
          <MiniCalendrier evenements={evenements.filter(e => new Date(e.quand) >= today)} jourActif={jourActif} setJourActif={setJourActif} />
        </div>
      )}

      {/* GRILLE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="font-black text-2xl text-gray-900">{loading ? "..." : evenementsFiltres.length}</span>
          <span className="text-sm font-medium text-gray-500">
            événement{evenementsFiltres.length > 1 ? "s" : ""}
            {filtreProximite && position && <span className="text-gray-400 ml-1">· {rayon} km</span>}
          </span>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({length:8}).map((_,i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
                <div className="h-36 bg-gray-100" />
                <div className="p-3 space-y-2"><div className="h-3 bg-gray-100 rounded-full w-1/2" /><div className="h-4 bg-gray-100 rounded-full w-3/4" /><div className="h-3 bg-gray-100 rounded-full w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : evenementsFiltres.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">😕</p>
            <p className="text-lg font-bold text-gray-700 mb-1">Aucun événement trouvé</p>
            <p className="text-sm text-gray-400 mb-4">Essaie de modifier tes filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {evenementsFiltres.map(e => {
              const dateLabel = formatDate(e.quand)
              const isToday = dateLabel === "Aujourd'hui"
              const isTomorrow = dateLabel === "Demain"
              const photoSrc = e.image_url || getFallbackPhoto(e.categorie, e.id)
              return (
                <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-40 overflow-hidden">
                    <img src={photoSrc} alt={e.titre} className="w-full h-full object-cover" loading="lazy" decoding="async"
                      onError={ev => { const img=ev.target as HTMLImageElement; if(!img.dataset.err){img.dataset.err="1";img.src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80"} }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
                    {isToday && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white z-10" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> Aujourd'hui
                      </div>
                    )}
                    {isTomorrow && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full text-xs font-bold z-10" style={{ background: "rgba(255,255,255,0.18)", color: "#374151" }}>
                        Demain
                      </div>
                    )}
                    <button onClick={ev => toggleFavori(ev,e.id)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-sm z-10 shadow-sm">
                      {favoris.includes(e.id) ? "❤️" : "🤍"}
                    </button>
                    <div className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-bold z-10 ${e.prix==="Gratuit"?"bg-white/90 text-green-700":"bg-white/90 text-gray-800"}`}>
                      {e.prix === "Gratuit" ? "Gratuit" : e.prix}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{e.categorie}</span>
                      {!isToday && !isTomorrow && e.quand && (
                        <span className="text-[10px] font-semibold text-gray-400">{dateLabel}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 mb-1">{e.titre}</h4>
                    <p className="text-gray-400 text-xs truncate">📍 {e.ville}{e.heure && <> · {e.heure}</>}</p>
                    {filtreProximite && position && e.lat && e.lng && (
                      <p className="text-gray-400 text-xs mt-1">{Math.round(getDistance(position.lat,position.lng,e.lat,e.lng))} km</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* PUB MOBILE */}
      {pubsFiltrees.length > 0 && pubActuel && (
        <div className="sm:hidden px-4 py-2.5 flex items-center justify-between gap-3 mx-4 mb-4 rounded-2xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold text-gray-500 bg-gray-200">Pub</span>
            <span className="text-sm font-semibold text-gray-700 truncate">{pubActuel.nom_commerce}</span>
          </div>
          <a href={pubActuel.lien} target="_blank" onClick={() => track("clic_pub", pubActuel.id, { nom: pubActuel.nom_commerce, device: "mobile" })} className="text-xs font-semibold text-gray-500 hover:underline flex-shrink-0">Voir →</a>
        </div>
      )}

      {/* MODALE QR */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">📲</div>
            <h3 className="font-black text-xl text-gray-900 mb-2" style={{ fontFamily: "'Syne',sans-serif" }}>Installer SortiesApp</h3>
            <p className="text-sm text-gray-500 mb-4">Scanne ce QR code pour installer l'app sur ton téléphone</p>
            <div className="flex justify-center mb-4">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent("https://sorties-app-seven.vercel.app/installer")}&bgcolor=ffffff&color=1a1a2e&qzone=1`}
                alt="QR Code" className="rounded-2xl border-4 border-gray-100" width={180} height={180} />
            </div>
            <button onClick={() => setShowQRModal(false)} className="w-full py-3 rounded-full font-bold text-white" style={{ background: ACCENT }}>Fermer</button>
          </div>
        </div>
      )}

      {/* MODALE GÉO BOTTOM SHEET */}
      {showGeoSheet && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowGeoSheet(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="font-black text-gray-900 text-lg mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>📍 Près de moi</h3>
            <p className="text-sm text-gray-400 mb-6">Affiche les événements dans un rayon autour de ta position.</p>

            {/* Slider rayon */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Rayon de recherche</span>
                <span className="text-lg font-black" style={{ color: "#1a1a2e", fontFamily: "'Syne', sans-serif" }}>{rayon} km</span>
              </div>
              <input type="range" min="5" max="200" step="5" value={rayon}
                onChange={e => setRayon(Number(e.target.value))}
                className="w-full accent-gray-900" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5 km</span>
                <span>100 km</span>
                <span>200 km</span>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col gap-3">
              {!filtreProximite ? (
                <button onClick={() => { activerGeolocalisation(); setShowGeoSheet(false) }}
                  disabled={loadingGeo}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-50"
                  style={{ background: "#1a1a2e" }}>
                  {loadingGeo ? "⏳ Localisation..." : "📍 Activer ma position"}
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#f0fdf4" }}>
                    <span className="text-green-500 text-xl">✅</span>
                    <div>
                      <p className="text-sm font-bold text-green-700">Position activée</p>
                      <p className="text-xs text-green-600">Événements dans {rayon} km autour de toi</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowGeoSheet(false) }}
                    className="w-full py-3 rounded-2xl font-bold text-white text-sm"
                    style={{ background: "#1a1a2e" }}>
                    Appliquer — {rayon} km
                  </button>
                  <button onClick={() => { setFiltreProximite(false); setPosition(null); setShowGeoSheet(false) }}
                    className="w-full py-2.5 rounded-2xl font-semibold text-gray-400 text-sm border border-gray-200">
                    Désactiver la localisation
                  </button>
                </>
              )}
              <button onClick={() => { setShowGeoSheet(false); router.push("/carte") }}
                className="w-full py-2.5 rounded-2xl font-semibold text-sm border border-gray-200 text-gray-600">
                🗺️ Explorer sur la carte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-8 py-10 px-4 sm:px-6" style={{ background: "#1a1a2e" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-black text-white text-lg mb-2">SortiesApp</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Trouve des activités et événements près de chez toi.</p>
            </div>
            {[
              { title: "Navigation", links: [{l:"Accueil",p:"/"},{l:"Carte",p:"/carte"},{l:"Publier",p:"/publier"},{l:"Tarifs",p:"/tarifs"}] },
              { title: "Support", links: [{l:"Contact",p:"/contact"},{l:"Signaler",p:"/contact"}] },
              { title: "Partenaires", links: [{l:"Publicité",p:"/contact"},{l:"Partenariat",p:"/contact"}] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-xs mb-3 tracking-widest uppercase text-gray-600">{col.title}</h4>
                <div className="flex flex-col gap-2">
                  {col.links.map(x => <button key={x.l} onClick={() => router.push(x.p)} className="text-sm text-left text-gray-400 hover:text-white transition-colors">{x.l}</button>)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-600">© 2026 SortiesApp. Tous droits réservés.</p>
            <div className="flex gap-4">
              {[{l:"Mentions légales",p:"/mentions-legales"},{l:"CGU",p:"/cgu"},{l:"Contact",p:"/contact"}].map(x => (
                <button key={x.l} onClick={() => router.push(x.p)} className="text-xs text-gray-600 hover:text-white transition-colors">{x.l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* NAV MOBILE */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-gray-200 z-40 shadow-lg" style={{ backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-around px-2 py-2">
          <button onClick={() => router.push("/")} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold" style={{ color: ACCENT }}>Accueil</span>
          </button>
          <button onClick={() => router.push("/carte")} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
            <span className="text-xl">🗺️</span>
            <span className="text-[10px] font-semibold text-gray-400">Carte</span>
          </button>
          <button onClick={() => router.push("/publier")} className="flex flex-col items-center gap-0.5 -mt-5">
            <span className="w-14 h-14 flex items-center justify-center text-white text-2xl font-black rounded-2xl shadow-lg" style={{ background: ACCENT }}>+</span>
          </button>
          <button onClick={() => user ? router.push("/dashboard") : router.push("/auth")} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-semibold text-gray-400">{user ? "Moi" : "Connexion"}</span>
          </button>
          {user?.email===ADMIN_EMAIL ? (
            <button onClick={() => router.push("/admin")} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
              <span className="text-xl">⚙️</span>
              <span className="text-[10px] font-bold text-gray-500">Admin</span>
            </button>
          ) : (
            <button onClick={() => user ? router.push("/dashboard") : router.push("/auth")} className="flex flex-col items-center gap-0.5 px-3 py-1.5">
              <span className="text-xl">❤️</span>
              <span className="text-[10px] font-semibold text-gray-400">Favoris</span>
            </button>
          )}
        </div>
      </nav>
      <div className="sm:hidden h-20" />
    </main>
  )
}