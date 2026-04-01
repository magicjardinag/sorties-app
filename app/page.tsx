"use client"
import { useState, useEffect, useRef, useCallback, memo } from "react"
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

// Config des slides du carrousel hero — couleurs vives, slogans humoristiques
const HERO_SLIDES = [
  {
    categorie: "Musique",
    emoji: "🎵",
    bg: "#7C3AED",
    accent: "#FCD34D",
    phrase: "Tes oreilles méritent mieux que Spotify.",
    sub: "Musique · en ce moment",
  },
  {
    categorie: "Sport",
    emoji: "🏃",
    bg: "#059669",
    accent: "#FCD34D",
    phrase: "Ton canapé survivra sans toi ce soir.",
    sub: "Sport · en ce moment",
  },
  {
    categorie: "Nature & Rando",
    emoji: "🌿",
    bg: "#0891B2",
    accent: "#FCD34D",
    phrase: "La nature existe aussi en vrai, paraît-il.",
    sub: "Nature & Rando · en ce moment",
  },
  {
    categorie: "Culture",
    emoji: "🎨",
    bg: "#D97706",
    accent: "#FEF3C7",
    phrase: "Sors, t'auras l'air cultivé au bureau lundi.",
    sub: "Culture · en ce moment",
  },
  {
    categorie: "Food",
    emoji: "🍕",
    bg: "#DC2626",
    accent: "#FCD34D",
    phrase: "Tu peux pas manger pareil chez toi. Promis.",
    sub: "Food · en ce moment",
  },
  {
    categorie: "Danse",
    emoji: "💃",
    bg: "#DB2777",
    accent: "#FCD34D",
    phrase: "Personne juge. Enfin presque.",
    sub: "Danse · en ce moment",
  },
  {
    categorie: "Bar & Nuit",
    emoji: "🍸",
    bg: "#1D4ED8",
    accent: "#FCD34D",
    phrase: "Un verre dehors, ça compte comme du social.",
    sub: "Bar & Nuit · en ce moment",
  },
  {
    categorie: "Atelier",
    emoji: "🛠️",
    bg: "#B45309",
    accent: "#FEF3C7",
    phrase: "Crée un truc. Même raté c'est sympa.",
    sub: "Atelier · en ce moment",
  },
  {
    categorie: "Enfants",
    emoji: "🧒",
    bg: "#0EA5E9",
    accent: "#FCD34D",
    phrase: "Épuise-les dehors. Dors mieux ce soir.",
    sub: "Enfants · en ce moment",
  },
  {
    categorie: "Animaux",
    emoji: "🐾",
    bg: "#16A34A",
    accent: "#FCD34D",
    phrase: "Ton chien a besoin de toi. (C'est lui qui le dit.)",
    sub: "Animaux · en ce moment",
  },
  {
    categorie: "Brocante",
    emoji: "🏺",
    bg: "#92400E",
    accent: "#FEF3C7",
    phrase: "Achète des trucs dont t'as pas besoin. Avec style.",
    sub: "Brocante · en ce moment",
  },
  {
    categorie: "Loto",
    emoji: "🎰",
    bg: "#BE185D",
    accent: "#FCD34D",
    phrase: "Ce soir c'est peut-être toi. (C'est pas toi.)",
    sub: "Loto · en ce moment",
  },
]

// Photos Unsplash — pool par catégorie avec mots-clés précis pour cohérence visuelle
const FALLBACK_PHOTOS_POOL: Record<string, string[]> = {
  "Musique": [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80", // concert foule
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80", // concert scène
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80", // festival musique
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80", // foule festival
    "https://images.unsplash.com/photo-1540039155733-5bb30b4f5bdc?w=600&q=80", // concert lumières
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80", // musiciens scène
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80", // concert extérieur
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80", // DJ concert
  ],
  "Sport": [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80", // running
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80", // sport athlétisme
    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80", // sport fitness
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80", // cyclisme
    "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&q=80", // sport collectif
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80", // football
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80", // natation
    "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&q=80", // golf sport
  ],
  "Danse": [
    "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&q=80", // danse scène
    "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&q=80", // danse couple
    "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&q=80", // danse ballet
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&q=80", // danse contemporaine
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80", // danse fitness
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&q=80", // salsa tango
    "https://images.unsplash.com/photo-1562088287-bde35a1ea917?w=600&q=80", // danse groupe
    "https://images.unsplash.com/photo-1578763363228-6e8428de69b2?w=600&q=80", // hip hop danse
  ],
  "Culture": [
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80", // musée art
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80", // exposition
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80", // peinture art
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80", // art contemporain
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80", // galerie art
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80", // théâtre spectacle
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80", // bibliothèque livres
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80", // cinéma
  ],
  "Atelier": [
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80", // atelier création
    "https://images.unsplash.com/photo-1459183885421-5cc683b8dbba?w=600&q=80", // poterie céramique
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80", // peinture atelier
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80", // couture broderie
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80", // menuiserie bois
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", // artisanat
    "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80", // cuisine atelier
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80", // photographie atelier
  ],
  "Food": [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80", // street food
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80", // restaurant repas
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80", // cuisine gastronomique
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80", // brunch petit déjeuner
    "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&q=80", // marché alimentaire
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80", // plat cuisiné
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80", // salade cuisine saine
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80", // pizza four
  ],
  "Nature & Rando": [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80", // randonnée montagne
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80", // sentier forêt
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=600&q=80", // montagne paysage
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80", // nature panorama
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80", // forêt arbres
    "https://images.unsplash.com/photo-1510797215324-95aa89f43c33?w=600&q=80", // lac montagne rando
    "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=600&q=80", // randonneurs sentier
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80", // bivouac camping
  ],
  "Animaux": [
    "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80", // chien labrador
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&q=80", // animaux nature
    "https://images.unsplash.com/photo-1444212477490-ca407925329e?w=600&q=80", // chat animal
    "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=600&q=80", // cheval équitation
    "https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=600&q=80", // chien balade
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80", // chien sport agility
    "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=600&q=80", // animaux ferme
    "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600&q=80", // chien golden
  ],
  "Brocante": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", // brocante marché
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80", // marché puces
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80", // antiquités objets
    "https://images.unsplash.com/photo-1567767292278-a3e6b3dba866?w=600&q=80", // vide grenier
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80", // vêtements vintage
    "https://images.unsplash.com/photo-1524117074681-31bd4de22ad3?w=600&q=80", // livres anciens
    "https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=600&q=80", // objets anciens
    "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&q=80", // vinyles disques
  ],
  "Bar & Nuit": [
    "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80", // bar cocktails
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80", // bar nuit
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80", // cocktail verre
    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&q=80", // boite nuit
    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80", // soirée amis bar
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80", // bar comptoir
    "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=600&q=80", // vin dégustation
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80", // cocktail shaker
  ],
  "Loto": [
    "https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=600&q=80", // salle événement
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80", // fête salle
    "https://images.unsplash.com/photo-1547226706-6f51c0a87af9?w=600&q=80", // loterie chance
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80", // foule animation
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80", // événement festif
  ],
  "Enfants": [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80", // enfants jeux
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80", // enfants activité
    "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=600&q=80", // enfants parc
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&q=80", // enfants nature
    "https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=600&q=80", // enfants sport
    "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80", // enfants peinture
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80", // enfants cirque
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80", // enfants animation
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
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return pool[Math.abs(hash) % pool.length]
}


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
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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
  const today = new Date(); today.setHours(0, 0, 0, 0)
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
        <button onClick={() => setMoisActuel(new Date(annee, mois - 1, 1))} className="text-gray-400 hover:text-orange-500 text-lg px-1">‹</button>
        <p className="font-bold text-gray-800 text-sm">{moisNoms[mois]} {annee}</p>
        <button onClick={() => setMoisActuel(new Date(annee, mois + 1, 1))} className="text-gray-400 hover:text-orange-500 text-lg px-1">›</button>
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
                ${isSelected ? "bg-orange-500 text-white" : isToday ? "bg-orange-100 text-orange-600 font-bold" :
                  isPast ? "text-gray-300 cursor-not-allowed" : hasEvent ? "text-gray-800 hover:bg-orange-50 cursor-pointer" : "text-gray-400 hover:bg-gray-50 cursor-pointer"}`}>
              {jour}
              {hasEvent && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />}
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

// ── HERO CARROUSEL ──────────────────────────────────────────────────────
function HeroCarousel({
  evenements,
  recherche,
  setRecherche,
  onCategorieChange,
}: {
  evenements: Evenement[]
  recherche: string
  setRecherche: (v: string) => void
  onCategorieChange: (cat: string) => void
}) {
  const [cur, setCur] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [phraseVisible, setPhraseVisible] = useState(true)
  const [slideEvents, setSlideEvents] = useState<Evenement[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)
  const today = new Date(); today.setHours(0, 0, 0, 0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const N = HERO_SLIDES.length

  useEffect(() => {
    const pool = evenements.filter(
      e => e.categorie === HERO_SLIDES[cur].categorie && new Date(e.quand) >= today
    )
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const count = Math.min(shuffled.length, Math.floor(Math.random() * 3) + 1)
    setSlideEvents(shuffled.slice(0, Math.max(count, 1)))
  }, [evenements, cur])

  function goTo(idx: number) {
    if (transitioning) return
    setTransitioning(true)
    setPhraseVisible(false)
    setTimeout(() => {
      const next = ((idx % N) + N) % N
      setCur(next)
      setPhraseVisible(true)
      setTransitioning(false)
    }, 320)
  }

  function startAuto() {
    if (autoRef.current) clearInterval(autoRef.current)
    autoRef.current = setInterval(() => goTo(cur + 1), 4500)
  }

  useEffect(() => {
    startAuto()
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [cur])

  const slide = HERO_SLIDES[cur]

  // Indices des cartes voisines visibles
  const prevIdx = ((cur - 1) + N) % N
  const nextIdx = (cur + 1) % N

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: slide.bg }}
    >
      {/* ── VERSION MOBILE ── */}
      {isMobile && <div
        className="px-4 py-6"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const diff = touchStartX.current - e.changedTouches[0].clientX
          if (Math.abs(diff) > 50) {
            if (diff > 0) goTo(cur + 1)
            else goTo(cur - 1)
            if (autoRef.current) clearInterval(autoRef.current)
            startAuto()
          }
          touchStartX.current = null
        }}
        style={{ touchAction: "pan-y", willChange: "transform" }}
      >
        {/* Label + emoji + dots */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 28 }}>{slide.emoji}</span>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: slide.accent }}>
              {slide.sub}
            </p>
          </div>

        </div>

        {/* Slogan */}
        <h2 className="font-black mb-4 hero-phrase" style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(24px, 7vw, 36px)",
          letterSpacing: "-1px",
          color: "#fff",
          lineHeight: 1.1,
          opacity: phraseVisible ? 1 : 0,
        }}>
          {slide.phrase}
        </h2>

        {/* Events */}
        <div className="flex flex-col gap-2 mb-4">
          {slideEvents.length > 0 ? slideEvents.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ fontSize: 16 }}>{e.emoji || slide.emoji}</span>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-xs truncate">{e.titre}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {e.ville}{e.heure ? ` · ${e.heure}` : ""}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                style={{ background: e.prix === "Gratuit" ? "#22c55e" : "rgba(255,255,255,0.2)", color: "#fff" }}>
                {e.prix}
              </span>
            </div>
          )) : (
            <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Aucun événement pour le moment</p>
            </div>
          )}
        </div>

        {/* Recherche */}


        {/* Dots */}
        <div className="flex gap-1.5 justify-center mt-4">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => { goTo(i); if (autoRef.current) clearInterval(autoRef.current); startAuto() }}
              className="rounded-full border-none cursor-pointer transition-all"
              style={{ width: i === cur ? 16 : 6, height: 6, background: i === cur ? "#fff" : "rgba(255,255,255,0.35)" }}/>
          ))}
        </div>
      </div>}

      {/* ── VERSION DESKTOP ── */}
      {!isMobile && <div className="max-w-7xl mx-auto px-6 py-10 flex items-center gap-8">
        {/* Carrousel catégories */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => { goTo(cur - 1); if (autoRef.current) clearInterval(autoRef.current); startAuto() }}
            className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl cursor-pointer transition-all opacity-50 hover:opacity-75 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.1)", minWidth: 80 }}>
            <span style={{ fontSize: 28 }}>{HERO_SLIDES[prevIdx].emoji}</span>
            <span className="text-white text-xs font-medium text-center leading-tight" style={{ fontSize: 11 }}>
              {HERO_SLIDES[prevIdx].categorie.replace(" & Rando", "")}
            </span>
          </button>
          <button onClick={() => { goTo(cur - 1); if (autoRef.current) clearInterval(autoRef.current); startAuto() }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)", fontSize: 18 }}>‹</button>
          <div className="flex flex-col items-center gap-3 rounded-2xl transition-all flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.18)", padding: "24px 20px", minWidth: 130 }}>
            <span style={{ fontSize: 52 }}>{slide.emoji}</span>
            <span className="text-white font-black text-center leading-tight" style={{ fontSize: 15, fontFamily: "'Syne', sans-serif" }}>
              {slide.categorie}
            </span>
            <div className="flex gap-1.5 mt-1">
              {HERO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => { goTo(i); if (autoRef.current) clearInterval(autoRef.current); startAuto() }}
                  className="rounded-full border-none cursor-pointer transition-all"
                  style={{ width: i === cur ? 16 : 6, height: 6, background: i === cur ? "#fff" : "rgba(255,255,255,0.35)" }}/>
              ))}
            </div>
          </div>
          <button onClick={() => { goTo(cur + 1); if (autoRef.current) clearInterval(autoRef.current); startAuto() }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)", fontSize: 18 }}>›</button>
          <button onClick={() => { goTo(cur + 1); if (autoRef.current) clearInterval(autoRef.current); startAuto() }}
            className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl cursor-pointer transition-all opacity-50 hover:opacity-75 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.1)", minWidth: 80 }}>
            <span style={{ fontSize: 28 }}>{HERO_SLIDES[nextIdx].emoji}</span>
            <span className="text-white text-xs font-medium text-center leading-tight" style={{ fontSize: 11 }}>
              {HERO_SLIDES[nextIdx].categorie.replace(" & Rando", "")}
            </span>
          </button>
        </div>

        {/* Contenu droit */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: slide.accent }}>
            {slide.sub}
          </p>
          <h2 className="font-black mb-5 transition-all duration-300" style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(28px, 4vw, 52px)",
            letterSpacing: "-1.5px",
            color: "#fff",
            lineHeight: 1.05,
            opacity: phraseVisible ? 1 : 0,
            transform: phraseVisible ? "translateY(0)" : "translateY(-12px)",
            transition: "opacity .3s ease, transform .3s ease",
          }}>
            {slide.phrase}
          </h2>
          <div className="flex flex-col gap-2 mb-5">
            {slideEvents.length > 0 ? slideEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-all hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span style={{ fontSize: 20 }}>{e.emoji || slide.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{e.titre}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {e.ville} · {formatDate(e.quand)}{e.heure ? ` · ${e.heure}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ml-3"
                  style={{ background: e.prix === "Gratuit" ? "#22c55e" : "rgba(255,255,255,0.2)", color: "#fff" }}>
                  {e.prix}
                </span>
              </div>
            )) : (
              <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Aucun événement pour le moment</p>
              </div>
            )}
          </div>
          <div className="flex items-center bg-white rounded-full px-4 py-2 gap-3 max-w-md" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <span className="text-gray-400">🔍</span>
            <input type="text" placeholder="Un concert, une rando, une soirée..."
              className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400 py-1"
              value={recherche} onChange={(e) => setRecherche(e.target.value)}/>
            <button className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold text-white transition-colors"
              style={{ background: slide.accent }}>Go →</button>
          </div>
        </div>
      </div>}
    </section>
  )
}
// ─────────────────────────────────────────────────────────────────────────

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
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [rayon, setRayon] = useState(50)
  const [filtreProximite, setFiltreProximite] = useState(false)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [showCalendrier, setShowCalendrier] = useState(false)
  const [menuMobileOpen, setMenuMobileOpen] = useState(false)
  const [showGeoModal, setShowGeoModal] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallBtn(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setShowInstallBtn(false))
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") setShowInstallBtn(false)
    setInstallPrompt(null)
  }

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
    // Propose géoloc si jamais refusé avant
    const hasSeenGeo = localStorage.getItem("geo_asked")
    if (!hasSeenGeo) {
      setTimeout(() => setShowGeoModal(true), 1800)
    }
  }, [])

  useEffect(() => {
    const len = (position
      ? pubs.filter(pub => !pub.lat || !pub.lng)
      : pubs).length
    if (len === 0) return
    const interval = setInterval(() => setPubIndex((prev) => (prev + 1) % Math.max(len, 1)), 5000)
    return () => clearInterval(interval)
  }, [pubs.length, position])

  const activerGeolocalisation = () => {
    setLoadingGeo(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setFiltreProximite(true); setLoadingGeo(false) },
      () => { alert("Impossible d'accéder à ta position."); setLoadingGeo(false) }
    )
  }
  const desactiverGeolocalisation = () => { setFiltreProximite(false); setPosition(null) }

  const toggleFavori = useCallback(async (e: React.MouseEvent, evenementId: string) => {
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
  }, [user, favoris])

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

  const isAgendaActif = showCalendrier || (jourActif !== "tout" && jourActif !== "weekend" && jourActif !== dates.today && jourActif !== dates.demain)

  return (
    <main className="min-h-screen" style={{ background: "#F7F6F2", WebkitOverflowScrolling: "touch" }}>
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

      {/* ── HEADER ── */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button onClick={() => router.push("/")} className="flex-shrink-0 font-black text-xl tracking-tight text-gray-900">
            Sorties<span style={{ color: "#FF4D00" }}>App</span>
          </button>
          <div className="hidden sm:flex flex-1 max-w-md items-center bg-gray-100 rounded-full px-4 py-2.5 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Événement, ville..." className="bg-transparent flex-1 text-sm text-gray-800 outline-none placeholder-gray-400 font-medium" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            {recherche && <button onClick={() => setRecherche("")} className="text-gray-400 text-sm">✕</button>}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => { const q = new URLSearchParams(); if (filtreProximite && position) { q.set("lat", position.lat.toString()); q.set("lng", position.lng.toString()); q.set("rayon", rayon.toString()) } if (categorieActive !== "Tout") q.set("categorie", categorieActive); router.push(`/carte?${q.toString()}`) }} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">🗺️ <span className="hidden md:inline">Carte</span></button>
            {user?.email === ADMIN_EMAIL && <button onClick={() => router.push("/admin")} className="px-3 py-2 rounded-full text-sm font-medium text-red-500 hover:bg-red-50">⚙️</button>}
            {user ? <button onClick={() => router.push("/dashboard")} className="px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">Mon espace</button>
              : <button onClick={() => router.push("/auth")} className="px-3 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100">Se connecter</button>}
            {showInstallBtn && (
              <button onClick={handleInstall} className="px-4 py-2 rounded-full text-sm font-bold border flex items-center gap-1.5 transition-all hover:bg-gray-50" style={{ borderColor: "#FF4D00", color: "#FF4D00" }}>
                📲 Installer l'app
              </button>
            )}
            <button onClick={() => router.push("/publier")} className="px-4 py-2 rounded-full text-sm font-bold text-white shadow-sm" style={{ background: "#FF4D00" }}>+ Publier</button>
          </div>
          <div className="flex sm:hidden items-center gap-1.5 flex-1 min-w-0 ml-2">
            <div className="flex flex-1 min-w-0 items-center bg-gray-100 rounded-full px-3 py-1.5 gap-1.5">
              <span className="text-gray-400 flex-shrink-0" style={{ fontSize: 13 }}>🔍</span>
              <input type="text" placeholder="Rechercher..." className="bg-transparent flex-1 min-w-0 text-xs text-gray-800 outline-none placeholder-gray-400" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              {recherche && <button onClick={() => setRecherche("")} className="text-gray-400 text-xs flex-shrink-0">✕</button>}
            </div>
            <button onClick={() => router.push("/carte")} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 flex-shrink-0" style={{ fontSize: 15 }}>🗺️</button>
            <button onClick={() => setMenuMobileOpen(!menuMobileOpen)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 flex-shrink-0" style={{ fontSize: 15 }}>☰</button>
          </div>
        </div>

        {menuMobileOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
            {user ? <button onClick={() => { router.push("/dashboard"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">👤 Mon espace</button>
              : <button onClick={() => { router.push("/auth"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">Se connecter</button>}
            <button onClick={() => { router.push("/tarifs"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">💎 Tarifs</button>
            {user?.email === ADMIN_EMAIL && <button onClick={() => { router.push("/admin"); setMenuMobileOpen(false) }} className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">⚙️ Admin</button>}
            {showInstallBtn && (
              <button onClick={() => { handleInstall(); setMenuMobileOpen(false) }} className="px-4 py-2.5 rounded-xl text-sm font-bold text-center border" style={{ borderColor: "#FF4D00", color: "#FF4D00" }}>
                📲 Installer l'app sur mon téléphone
              </button>
            )}
            <button onClick={() => { router.push("/publier"); setMenuMobileOpen(false) }} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white text-center" style={{ background: "#FF4D00" }}>+ Publier un événement</button>
          </div>
        )}
      </header>

      {/* ── PUB — cachée sur mobile (affichée en bas) ── */}
      {pubsFiltrees.length > 0 && pubActuel && (
        <div className="hidden sm:flex border-b border-amber-100 px-4 py-2.5 items-center justify-between gap-3" style={{ background: "#FFFBEB" }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold text-amber-700" style={{ background: "#FDE68A" }}>Pub</span>
            <span className="text-sm font-semibold text-gray-800 truncate">{pubActuel.nom_commerce}</span>
            <span className="text-sm text-amber-700 hidden sm:inline truncate">{pubActuel.description}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={pubActuel.lien} target="_blank" className="text-xs font-semibold hover:underline whitespace-nowrap" style={{ color: "#FF4D00" }}>Voir →</a>
            <div className="flex gap-1">{pubsFiltrees.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === pubIndex % pubsFiltrees.length ? "bg-amber-500" : "bg-amber-200"}`} />)}</div>
          </div>
        </div>
      )}

      {/* ── HERO CARROUSEL ── */}
      <HeroCarousel
        evenements={evenements}
        recherche={recherche}
        setRecherche={setRecherche}
        onCategorieChange={() => {}}
      />

      {/* ── MODALE GÉOLOC ── */}
      {showGeoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => { setShowGeoModal(false); localStorage.setItem("geo_asked", "1") }}>
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📍</div>
              <h3 className="font-black text-xl text-gray-900 mb-1">Autour de toi ?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Dis-nous où tu es et on te montre les événements à portée de main.
              </p>
            </div>
            <button
              onClick={() => {
                setShowGeoModal(false)
                localStorage.setItem("geo_asked", "1")
                activerGeolocalisation()
              }}
              className="w-full py-3 rounded-2xl font-bold text-white text-sm mb-3 transition-all active:scale-[0.98]"
              style={{ background: "#FF4D00" }}>
              📍 Oui, trouve des events près de moi
            </button>
            <button
              onClick={() => { setShowGeoModal(false); localStorage.setItem("geo_asked", "1") }}
              className="w-full py-2.5 rounded-2xl font-semibold text-gray-400 text-sm hover:text-gray-600 transition-colors">
              Non merci, je cherche ailleurs
            </button>
          </div>
        </div>
      )}


      {/* ── CALENDRIER MOBILE ── */}
      {showCalendrier && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCalendrier(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
            <MiniCalendrier evenements={evenements.filter(e => new Date(e.quand) >= today)} jourActif={jourActif} setJourActif={setJourActif} />
            <button onClick={() => setShowCalendrier(false)} className="mt-3 w-72 bg-white text-gray-600 py-2.5 rounded-2xl text-sm font-semibold shadow-lg">Fermer ✕</button>
          </div>
        </div>
      )}

      {/* ── FILTRES ── */}
      <section id="grille" className="bg-white border-b border-gray-100 px-4 sm:px-6 pt-4 pb-3">
        <div className="max-w-7xl mx-auto space-y-3">

          {/* Ligne 1 : dates + Agenda + géoloc côte à côte */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center" style={{ scrollbarWidth: "none" }}>
            {filtresBoutons.map((f) => (
              <button key={f.value} onClick={() => { setJourActif(f.value); setShowCalendrier(false) }}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border"
                style={{ background: jourActif === f.value ? "#FF4D00" : "#fff", color: jourActif === f.value ? "#fff" : "#555", borderColor: jourActif === f.value ? "#FF4D00" : "#e5e5e5" }}>
                {f.label}
              </button>
            ))}
            <div className="w-px flex-shrink-0 bg-gray-200 mx-1 self-stretch" />
            {/* Agenda */}
            <button onClick={() => setShowCalendrier(!showCalendrier)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border"
              style={{ background: isAgendaActif ? "#FF4D00" : "#fff", color: isAgendaActif ? "#fff" : "#555", borderColor: isAgendaActif ? "#FF4D00" : "#e5e5e5" }}>
              📅 <span>{jourActif !== "tout" && jourActif !== "weekend" && jourActif !== dates.today && jourActif !== dates.demain ? new Date(jourActif).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "Agenda"}</span>
            </button>
            {/* Géoloc — juste à côté d'Agenda */}
            {!filtreProximite ? (
              <button onClick={activerGeolocalisation} disabled={loadingGeo}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all disabled:opacity-50 whitespace-nowrap"
                style={{ background: "#EFF6FF", color: "#1e40af", borderColor: "#bfdbfe" }}>
                {loadingGeo ? "⏳" : "📍"} Près de moi
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0 rounded-full px-3 py-2 border whitespace-nowrap" style={{ background: "#EFF6FF", borderColor: "#bfdbfe" }}>
                <span className="text-xs font-semibold text-blue-800">📍 {rayon} km</span>
                <input type="range" min="5" max="200" step="5" value={rayon} onChange={(e) => setRayon(Number(e.target.value))} className="w-20" />
                <button onClick={desactiverGeolocalisation} className="text-blue-400 hover:text-blue-700 text-sm">✕</button>
              </div>
            )}
          </div>

          {/* Ligne 2 : catégories */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <button key={cat.label} onClick={() => setCategorieActive(cat.label)}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-all border"
                style={{
                  background: categorieActive === cat.label ? "#FF4D00" : "#fff",
                  color: categorieActive === cat.label ? "#fff" : "#555",
                  borderColor: categorieActive === cat.label ? "#FF4D00" : "#e5e5e5",
                }}>
                <span style={{ fontSize: 15, lineHeight: 1 }}>{cat.emoji}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ── LAYOUT PRINCIPAL ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6 items-start">
        {showCalendrier && (
          <div className="hidden lg:block flex-shrink-0 sticky top-24">
            <MiniCalendrier evenements={evenements.filter(e => new Date(e.quand) >= today)} jourActif={jourActif} setJourActif={setJourActif} />
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
              {filtreProximite && <button onClick={() => setRayon(r => Math.min(r + 25, 200))} className="mt-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold shadow-sm" style={{ background: "#FF4D00" }}>Élargir → {rayon + 25} km</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {evenementsFiltres.map((e) => {
                const dateLabel = formatDate(e.quand)
                const isToday = dateLabel === "Aujourd'hui"
                const isTomorrow = dateLabel === "Demain"
                const photoSrc = e.image_url || getFallbackPhoto(e.categorie, e.id)
                return (
                  <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)}
                    className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm">
                    <div className="relative h-40 overflow-hidden">
                      {/* Photo — fallback Unsplash si pas d'image */}
                      <img
                        src={photoSrc}
                        alt={e.titre}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(ev) => {
                          (ev.target as HTMLImageElement).src = getFallbackPhoto(e.categorie, e.id)
                        }}
                      />
                      {/* Overlay dégradé bas */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)" }} />

                      {/* Badge urgence en haut à gauche */}
                      {isToday && (
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white z-10"
                          style={{ background: "#FF4D00" }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                          Aujourd'hui
                        </div>
                      )}
                      {isTomorrow && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full text-xs font-bold z-10"
                          style={{ background: "#FCD34D", color: "#92400e" }}>
                          Demain
                        </div>
                      )}

                      {/* Favori */}
                      <button onClick={(ev) => toggleFavori(ev, e.id)}
                        className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-sm hover:scale-110 transition-transform z-10 shadow-sm">
                        {favoris.includes(e.id) ? "❤️" : "🤍"}
                      </button>

                      {/* Prix en bas à gauche sur l'image */}
                      <div className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-bold z-10 ${
                        e.prix === "Gratuit" ? "bg-green-500 text-white" : "bg-white/90 text-gray-900"
                      }`}>
                        {e.prix === "Gratuit" ? "🎁 Gratuit" : e.prix}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "#FEF3C7", color: "#92400e" }}>
                          {e.categorie}
                        </span>
                        {!isToday && !isTomorrow && e.quand && (
                          <span className="text-[10px] font-semibold" style={{ color: "#FF4D00" }}>
                            {dateLabel}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 mb-1">{e.titre}</h4>
                      <p className="text-gray-400 text-xs truncate">
                        📍 {e.ville}{e.heure && <> · {e.heure}</>}
                      </p>
                      {filtreProximite && position && e.lat && e.lng && (
                        <p className="text-blue-400 text-xs mt-1 font-medium">
                          {Math.round(getDistance(position.lat, position.lng, e.lat, e.lng))} km
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── PUB MOBILE — en bas avant footer ── */}
      {pubsFiltrees.length > 0 && pubActuel && (
        <div className="sm:hidden px-4 py-2.5 flex items-center justify-between gap-3 mx-4 mb-4 rounded-2xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold text-amber-700" style={{ background: "#FDE68A" }}>Pub</span>
            <span className="text-sm font-semibold text-gray-800 truncate">{pubActuel.nom_commerce}</span>
            <span className="text-xs text-amber-700 truncate">{pubActuel.description}</span>
          </div>
          <a href={pubActuel.lien} target="_blank" className="text-xs font-semibold hover:underline whitespace-nowrap flex-shrink-0" style={{ color: "#FF4D00" }}>Voir →</a>
        </div>
      )}

      {/* ── FOOTER ── */}
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

      {/* ── MOBILE BOTTOM NAV ── */}
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
      <div className="sm:hidden h-20" />
    </main>
  )
}