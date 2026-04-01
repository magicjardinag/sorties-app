"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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

function formatDateLong(dateStr: string): string {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  })
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric"
  })
}

function genererICS(evenement: Evenement): string {
  const date = evenement.quand.replace(/-/g, "")
  const heure = evenement.heure?.replace(":", "") || "090000"
  const heureDebut = `${date}T${heure}00`
  const heureFin = `${date}T${String(parseInt(heure.slice(0, 2)) + 2).padStart(2, "0")}${heure.slice(2)}00`
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SortiesApp//FR\nBEGIN:VEVENT\nDTSTART:${heureDebut}\nDTEND:${heureFin}\nSUMMARY:${evenement.titre}\nDESCRIPTION:${evenement.description || ""}\nLOCATION:${evenement.ville}\nEND:VEVENT\nEND:VCALENDAR`
}

function genererLienGoogleCalendar(evenement: Evenement): string {
  const date = evenement.quand.replace(/-/g, "")
  const heure = evenement.heure?.replace(":", "") || "0900"
  const heureDebut = `${date}T${heure}00`
  const heureFin = `${date}T${String(parseInt(heure.slice(0, 2)) + 2).padStart(2, "0")}${heure.slice(2)}00`
  const p = new URLSearchParams({
    action: "TEMPLATE", text: evenement.titre,
    dates: `${heureDebut}/${heureFin}`,
    details: evenement.description || "", location: evenement.ville,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

const FALLBACK_PHOTOS: Record<string, string[]> = {
  "Musique":        ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80","https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"],
  "Sport":          ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80","https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80","https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80","https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80"],
  "Danse":          ["https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&q=80","https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800&q=80","https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=800&q=80","https://images.unsplash.com/photo-1578763363228-6e8428de69b2?w=800&q=80"],
  "Culture":        ["https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80","https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80","https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80","https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80"],
  "Atelier":        ["https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80","https://images.unsplash.com/photo-1459183885421-5cc683b8dbba?w=800&q=80","https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80","https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"],
  "Food":           ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80","https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80"],
  "Nature & Rando": ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80","https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80","https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=800&q=80","https://images.unsplash.com/photo-1510797215324-95aa89f43c33?w=800&q=80"],
  "Animaux":        ["https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80","https://images.unsplash.com/photo-1560743641-3914f2c45636?w=800&q=80","https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=800&q=80","https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80"],
  "Brocante":       ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80","https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=80","https://images.unsplash.com/photo-1524117074681-31bd4de22ad3?w=800&q=80","https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80"],
  "Bar & Nuit":     ["https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80","https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80","https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80","https://images.unsplash.com/photo-1574096079513-d8259312b785?w=800&q=80"],
  "Loto":           ["https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=800&q=80","https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80","https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80"],
  "Enfants":        ["https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80","https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80","https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=800&q=80"],
  "Gratuit":        ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80","https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80"],
}

function getFallbackPhoto(categorie: string, seed?: string): string {
  const pool = FALLBACK_PHOTOS[categorie] || FALLBACK_PHOTOS["Gratuit"] || ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"]
  if (!seed) return pool[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return pool[Math.abs(hash) % pool.length]
}


// Fonds organiques pastels par catégorie
function OrganicBackground({ categorie }: { categorie: string }) {
  const configs: Record<string, { bg: string; blobs: Array<{ d?: string; cx?: number; cy?: number; r?: number; rx?: number; ry?: number; fill: string; opacity: number; type: "path" | "circle" | "ellipse" }> }> = {
    "Danse": {
      bg: "#FFF5F7",
      blobs: [
        { type: "path", d: "M-60 120 C20 20 140 -20 220 50 C300 120 290 220 200 250 C110 280 20 260 -20 210 C-60 160 -140 220 -60 120Z", fill: "#FFB3C6", opacity: .65 },
        { type: "path", d: "M380 -30 C460 20 520 100 490 180 C460 260 370 270 310 220 C250 170 260 80 310 30 C360 -20 300 -80 380 -30Z", fill: "#FF85A1", opacity: .45 },
        { type: "circle", cx: 420, cy: 320, r: 80, fill: "#FFD6E0", opacity: .5 },
        { type: "circle", cx: 80, cy: 20, r: 50, fill: "#FFB3C6", opacity: .35 },
      ]
    },
    "Musique": {
      bg: "#F8F0FF",
      blobs: [
        { type: "path", d: "M-40 100 C30 -10 160 0 210 80 C260 160 230 260 150 275 C70 290 -10 255 -35 200 C-60 145 -110 210 -40 100Z", fill: "#CE93D8", opacity: .55 },
        { type: "path", d: "M370 -20 C455 25 510 120 475 195 C440 270 350 265 300 210 C250 155 265 70 315 25 C365 -20 285 -65 370 -20Z", fill: "#AB47BC", opacity: .4 },
        { type: "ellipse", cx: 200, cy: 30, rx: 110, ry: 55, fill: "#E1BEE7", opacity: .5 },
        { type: "circle", cx: 430, cy: 270, r: 65, fill: "#CE93D8", opacity: .3 },
      ]
    },
    "Sport": {
      bg: "#F0F7FF",
      blobs: [
        { type: "path", d: "M-50 110 C20 10 150 -5 205 70 C260 145 235 240 160 255 C85 270 5 240 -25 190 C-55 140 -120 210 -50 110Z", fill: "#90CAF9", opacity: .6 },
        { type: "path", d: "M385 -10 C465 35 515 130 480 200 C445 270 355 265 305 210 C255 155 270 70 320 25 C370 -20 305 -55 385 -10Z", fill: "#42A5F5", opacity: .38 },
        { type: "ellipse", cx: 220, cy: 290, rx: 100, ry: 45, fill: "#BBDEFB", opacity: .5 },
        { type: "circle", cx: 60, cy: 35, r: 55, fill: "#90CAF9", opacity: .35 },
      ]
    },
    "Nature & Rando": {
      bg: "#F3FFF5",
      blobs: [
        { type: "path", d: "M-45 95 C30 -15 155 10 205 85 C255 160 220 255 145 268 C70 281 -5 250 -30 200 C-55 150 -120 205 -45 95Z", fill: "#A8E6CF", opacity: .65 },
        { type: "path", d: "M375 0 C455 45 505 140 470 210 C435 280 345 272 295 215 C245 158 262 72 312 27 C362 -18 295 -45 375 0Z", fill: "#69D99E", opacity: .45 },
        { type: "ellipse", cx: 205, cy: 25, rx: 105, ry: 50, fill: "#C8F5DA", opacity: .45 },
        { type: "circle", cx: 445, cy: 280, r: 60, fill: "#A8E6CF", opacity: .35 },
      ]
    },
    "Food": {
      bg: "#FFF8F0",
      blobs: [
        { type: "path", d: "M-40 105 C25 5 150 -10 200 70 C250 150 220 245 145 260 C70 275 -5 245 -30 195 C-55 145 -105 205 -40 105Z", fill: "#FFCC80", opacity: .65 },
        { type: "path", d: "M380 -15 C460 30 510 125 478 198 C446 271 356 265 306 208 C256 151 270 66 320 21 C370 -24 300 -60 380 -15Z", fill: "#FFA726", opacity: .4 },
        { type: "circle", cx: 215, cy: 285, r: 85, fill: "#FFE0B2", opacity: .55 },
        { type: "ellipse", cx: 75, cy: 25, rx: 80, ry: 45, fill: "#FFCC80", opacity: .38 },
      ]
    },
    "Culture": {
      bg: "#FFFFF0",
      blobs: [
        { type: "path", d: "M-50 100 C20 -5 148 8 198 82 C248 156 218 250 143 264 C68 278 -8 248 -33 198 C-58 148 -120 205 -50 100Z", fill: "#FFF59D", opacity: .7 },
        { type: "path", d: "M378 -12 C458 33 508 128 476 200 C444 272 354 266 304 209 C254 152 268 67 318 22 C368 -23 298 -57 378 -12Z", fill: "#FFEE58", opacity: .48 },
        { type: "circle", cx: 208, cy: 28, rx: 70, ry: 70, r: 68, fill: "#FFF9C4", opacity: .55 },
        { type: "circle", cx: 440, cy: 268, r: 58, fill: "#FFF59D", opacity: .38 },
      ]
    },
    "Bar & Nuit": {
      bg: "#F0F4FF",
      blobs: [
        { type: "path", d: "M-45 105 C28 8 152 12 200 88 C248 164 216 256 140 268 C64 280 -10 248 -34 196 C-58 144 -118 202 -45 105Z", fill: "#9FA8DA", opacity: .55 },
        { type: "path", d: "M372 -8 C452 36 502 132 470 204 C438 276 348 268 298 210 C248 152 263 67 313 22 C363 -23 292 -52 372 -8Z", fill: "#5C6BC0", opacity: .38 },
        { type: "ellipse", cx: 212, cy: 292, rx: 108, ry: 48, fill: "#C5CAE9", opacity: .5 },
        { type: "circle", cx: 65, cy: 32, r: 52, fill: "#9FA8DA", opacity: .35 },
      ]
    },
    "Atelier": {
      bg: "#FFF9F0",
      blobs: [
        { type: "path", d: "M-42 102 C26 6 150 8 198 84 C246 160 218 252 142 266 C66 280 -8 250 -32 200 C-56 150 -110 198 -42 102Z", fill: "#FFAB91", opacity: .6 },
        { type: "path", d: "M376 -14 C456 31 506 126 474 198 C442 270 352 264 302 207 C252 150 266 65 316 20 C366 -25 296 -59 376 -14Z", fill: "#FF7043", opacity: .38 },
        { type: "circle", cx: 210, cy: 286, r: 78, fill: "#FFCCBC", opacity: .5 },
        { type: "ellipse", cx: 72, cy: 22, rx: 76, ry: 42, fill: "#FFAB91", opacity: .36 },
      ]
    },
    "Animaux": {
      bg: "#F5FFF5",
      blobs: [
        { type: "path", d: "M-48 98 C24 2 148 6 196 82 C244 158 216 250 140 264 C64 278 -10 248 -34 198 C-58 148 -116 196 -48 98Z", fill: "#C8E6C9", opacity: .65 },
        { type: "path", d: "M374 -16 C454 28 504 124 472 196 C440 268 350 262 300 205 C250 148 264 63 314 18 C364 -27 294 -60 374 -16Z", fill: "#66BB6A", opacity: .4 },
        { type: "circle", cx: 208, cy: 288, r: 80, fill: "#DCEDC8", opacity: .5 },
        { type: "circle", cx: 62, cy: 28, r: 50, fill: "#C8E6C9", opacity: .36 },
      ]
    },
    "Brocante": {
      bg: "#FFF8F5",
      blobs: [
        { type: "path", d: "M-46 104 C22 4 146 8 196 84 C246 160 218 252 142 266 C66 280 -6 250 -30 200 C-54 150 -114 202 -46 104Z", fill: "#FFCCBC", opacity: .65 },
        { type: "path", d: "M376 -12 C456 32 506 128 474 200 C442 272 352 266 302 208 C252 150 266 65 316 20 C366 -25 296 -58 376 -12Z", fill: "#FF8A65", opacity: .38 },
        { type: "ellipse", cx: 210, cy: 290, rx: 106, ry: 46, fill: "#FFE0D0", opacity: .5 },
        { type: "circle", cx: 68, cy: 26, r: 52, fill: "#FFCCBC", opacity: .36 },
      ]
    },
    "Enfants": {
      bg: "#F5F8FF",
      blobs: [
        { type: "path", d: "M-44 100 C24 4 148 8 198 84 C248 160 220 252 144 266 C68 280 -8 250 -32 200 C-56 150 -112 198 -44 100Z", fill: "#B3E5FC", opacity: .65 },
        { type: "path", d: "M374 -14 C454 30 504 126 472 198 C440 270 350 264 300 206 C250 148 264 63 314 18 C364 -27 294 -58 374 -14Z", fill: "#29B6F6", opacity: .38 },
        { type: "circle", cx: 208, cy: 288, r: 78, fill: "#E1F5FE", opacity: .5 },
        { type: "ellipse", cx: 70, cy: 24, rx: 74, ry: 40, fill: "#B3E5FC", opacity: .36 },
      ]
    },
    "Loto": {
      bg: "#FFF0F8",
      blobs: [
        { type: "path", d: "M-46 102 C22 2 148 6 198 82 C248 158 220 250 144 264 C68 278 -8 248 -32 198 C-56 148 -114 196 -46 102Z", fill: "#F8BBD0", opacity: .65 },
        { type: "path", d: "M374 -16 C454 28 504 124 472 196 C440 268 350 262 300 204 C250 146 264 61 314 16 C364 -29 294 -60 374 -16Z", fill: "#EC407A", opacity: .36 },
        { type: "circle", cx: 208, cy: 288, r: 80, fill: "#FCE4EC", opacity: .5 },
        { type: "circle", cx: 66, cy: 26, r: 50, fill: "#F8BBD0", opacity: .35 },
      ]
    },
  }

  const cfg = configs[categorie] || configs["Musique"]

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 500 320"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 0 }}
    >
      <rect width="500" height="320" fill={cfg.bg} />
      {cfg.blobs.map((b, i) => {
        if (b.type === "path") return <path key={i} d={b.d} fill={b.fill} opacity={b.opacity} />
        if (b.type === "circle") return <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={b.fill} opacity={b.opacity} />
        return <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={b.fill} opacity={b.opacity} />
      })}
    </svg>
  )
}

export default function EvenementDetail() {
  const router = useRouter()
  const params = useParams()
  const [evenement, setEvenement] = useState<Evenement | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLightbox, setShowLightbox] = useState(false)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [rappelEnvoye, setRappelEnvoye] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [showAgenda, setShowAgenda] = useState(false)
  const [favori, setFavori] = useState(false)
  const [hasParticipated, setHasParticipated] = useState(false)
  const [participationCount, setParticipationCount] = useState(0)
  const [vuesCount, setVuesCount] = useState(0)

  useEffect(() => {
    const fetchEvenement = async () => {
      const { data, error } = await supabase.from("evenements").select("*").eq("id", params.id).single()
      if (error) { console.error(error) } else { setEvenement(data) }
      setLoading(false)
    }
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchEvenement()
    fetchUser()
  }, [params.id])

  // Tracker la vue + charger stats quand l'événement est chargé
  useEffect(() => {
    if (!evenement) return
    // Enregistrer la vue
    supabase.from("vues_evenements").insert({
      evenement_id: evenement.id,
      user_agent: navigator.userAgent.slice(0, 200),
    }).then(() => {})
    // Charger le nb de vues
    supabase.from("vues_evenements")
      .select("id", { count: "exact" })
      .eq("evenement_id", evenement.id)
      .then(({ count }) => setVuesCount(count || 0))
    // Charger le nb de participations
    supabase.from("participations")
      .select("id", { count: "exact" })
      .eq("evenement_id", evenement.id)
      .then(({ count }) => setParticipationCount(count || 0))
  }, [evenement?.id])

  // Vérifier si l'user a déjà participé
  useEffect(() => {
    if (!user || !evenement) return
    supabase.from("participations")
      .select("id")
      .eq("evenement_id", evenement.id)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setHasParticipated(!!data))
  }, [user, evenement?.id])

  const telechargerICS = () => {
    if (!evenement) return
    const ics = genererICS(evenement)
    const blob = new Blob([ics], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${evenement.titre}.ics`; a.click()
    URL.revokeObjectURL(url)
  }

  const demanderRappel = async () => {
    if (!user) { router.push("/auth"); return }
    if (!evenement) return
    try {
      await fetch("/api/rappel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, titre: evenement.titre, ville: evenement.ville,
          quand: evenement.quand, heure: evenement.heure, prix: evenement.prix,
          evenement_id: evenement.id, image_url: evenement.image_url,
          lat: evenement.lat, lng: evenement.lng, description: evenement.description,
        })
      })
      setRappelEnvoye(true)
    } catch (err) { console.error(err) }
  }

  const participer = async () => {
    if (!user) { router.push("/auth"); return }
    if (!evenement) return
    if (hasParticipated) {
      // Annuler participation
      await supabase.from("participations")
        .delete()
        .eq("evenement_id", evenement.id)
        .eq("user_id", user.id)
      setHasParticipated(false)
      setParticipationCount(c => Math.max(0, c - 1))
    } else {
      // Ajouter participation
      await supabase.from("participations")
        .insert({ evenement_id: evenement.id, user_id: user.id })
      setHasParticipated(true)
      setParticipationCount(c => c + 1)
    }
  }

  const partager = () => {
    if (navigator.share) {
      navigator.share({ title: evenement?.titre, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#F4F0FF" }}>
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </main>
    )
  }

  if (!evenement) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#F4F0FF" }}>
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-gray-500 font-medium mb-4">Événement introuvable</p>
          <button onClick={() => router.push("/")} className="px-5 py-2.5 rounded-full text-sm font-bold text-white" style={{ background: "#7C3AED" }}>
            ← Retour
          </button>
        </div>
      </main>
    )
  }

  const photoSrc = evenement.image_url || getFallbackPhoto(evenement.categorie, evenement.id)
  const lienMaps = evenement.lat && evenement.lng
    ? `https://www.google.com/maps?q=${evenement.lat},${evenement.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(evenement.ville || "")}`
  const isGratuit = evenement.prix === "Gratuit"

  // Date badge (jour / mois)
  const dateObj = new Date(evenement.quand)
  const jourNum = dateObj.toLocaleDateString("fr-FR", { day: "numeric" })
  const moisCourt = dateObj.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace(".", "")

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Fond organique en arrière-plan global */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <OrganicBackground categorie={evenement.categorie} />
      </div>

      {/* ── LIGHTBOX ── */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setShowLightbox(false)}>
          <button className="absolute top-5 right-5 text-white/70 hover:text-white text-3xl">✕</button>
          <img src={photoSrc} alt={evenement.titre} className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── MODALE AGENDA ── */}
      {showAgenda && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAgenda(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="font-black text-lg text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Ajouter à l'agenda</h3>
            <div className="flex flex-col gap-3">
              <button onClick={() => { window.open(genererLienGoogleCalendar(evenement), "_blank"); setShowAgenda(false) }}
                className="flex items-center gap-3 w-full border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">📅</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Google Calendar</p>
                  <p className="text-xs text-gray-400">Ouvre Google Calendar</p>
                </div>
              </button>
              <button onClick={() => { telechargerICS(); setShowAgenda(false) }}
                className="flex items-center gap-3 w-full border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">🍎</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Apple / Outlook</p>
                  <p className="text-xs text-gray-400">Télécharge un fichier .ics</p>
                </div>
              </button>
              <button onClick={() => { demanderRappel(); setShowAgenda(false) }}
                disabled={rappelEnvoye}
                className="flex items-center gap-3 w-full border rounded-2xl p-4 transition-colors text-left"
                style={{ borderColor: rappelEnvoye ? "#22c55e" : "#7C3AED", background: rappelEnvoye ? "#F0FDF4" : "#F5F3FF" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: rappelEnvoye ? "#DCFCE7" : "#EDE9FE" }}>
                  {rappelEnvoye ? "✅" : "🔔"}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: rappelEnvoye ? "#16a34a" : "#7C3AED" }}>
                    {rappelEnvoye ? "Rappel confirmé !" : "Rappel email J-1"}
                  </p>
                  <p className="text-xs text-gray-400">Reçois un email la veille</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO HERO ── */}
      <div className="relative w-full" style={{ height: "55vh", maxHeight: 440, zIndex: 1 }}>
        <img
          src={photoSrc}
          alt={evenement.titre}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => setShowLightbox(true)}
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_PHOTOS["Gratuit"] }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent" />

        {/* Boutons top */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe pt-5">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
          >
            ‹
          </button>
          <button
            onClick={() => setFavori(f => !f)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
          >
            {favori ? "❤️" : "🤍"}
          </button>
        </div>

        {/* Badge date */}
        <div
          className="absolute top-16 right-4 flex flex-col items-center justify-center rounded-2xl text-white font-black leading-none"
          style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", padding: "8px 12px", minWidth: 48 }}
        >
          <span style={{ fontSize: 20 }}>{jourNum}</span>
          <span style={{ fontSize: 10, letterSpacing: 1 }}>{moisCourt}</span>
        </div>
      </div>

      {/* ── CARTE TITRE (violet comme la capture) ── */}
      <div className="mx-4 -mt-6 rounded-3xl relative overflow-hidden" style={{ zIndex: 2, background: "linear-gradient(135deg, #7C3AED, #9333EA)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-wide mb-1">{evenement.categorie}</p>
            <h1 className="text-white font-black text-xl leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              {evenement.titre}
            </h1>
            <p className="text-purple-200 text-sm mt-1 font-medium capitalize">
              {formatDateShort(evenement.quand)}{evenement.heure ? ` · ${evenement.heure}` : ""}
            </p>
          </div>
          {/* Bouton partager */}
          <button
            onClick={partager}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            {copied ? "✅" : "↗"}
          </button>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="px-4 pt-5 pb-32 flex flex-col gap-4 max-w-lg mx-auto" style={{ position: "relative", zIndex: 2 }}>

        {/* Date & Lieu — deux colonnes comme la capture */}
        <div className="bg-white rounded-3xl p-5 grid grid-cols-2 gap-4 shadow-sm" style={{ border: "1px solid #EDE9FE" }}>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Date :</p>
            <p className="font-bold text-gray-900 text-sm capitalize leading-snug">{formatDateLong(evenement.quand)}</p>
            {evenement.heure && <p className="font-bold mt-1" style={{ color: "#7C3AED", fontSize: 13 }}>{evenement.heure}</p>}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Lieu :</p>
            <p className="font-bold text-gray-900 text-sm">{evenement.ville}</p>
            <button onClick={() => window.open(lienMaps, "_blank")} className="text-xs font-semibold mt-1 block" style={{ color: "#7C3AED" }}>
              Voir sur la carte →
            </button>
          </div>
        </div>

        {/* Organisateur + note */}
        <div className="bg-white rounded-3xl p-5 shadow-sm flex items-center justify-between" style={{ border: "1px solid #EDE9FE" }}>
          <div className="flex items-center gap-3">
            {/* Avatars empilés */}
            <div className="flex -space-x-2">
              {["#7C3AED", "#9333EA", "#C026D3"].map((c, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: c }}>
                  {evenement.organisateur?.charAt(i) || "?"}
                </div>
              ))}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{evenement.organisateur || "Organisateur"}</p>
              <p className="text-xs text-gray-400">Organisateur vérifié</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-900 text-sm">4.8</span>
            <span style={{ fontSize: 16 }}>⭐</span>
          </div>
        </div>

        {/* Description */}
        {evenement.description && (
          <div className="bg-white rounded-3xl p-5 shadow-sm" style={{ border: "1px solid #EDE9FE" }}>
            <h2 className="font-black text-gray-900 text-base mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>À propos</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {showFullDesc || evenement.description.length < 200
                ? evenement.description
                : `${evenement.description.slice(0, 200)}...`}
            </p>
            {evenement.description.length >= 200 && (
              <button onClick={() => setShowFullDesc(f => !f)} className="font-bold text-sm mt-2" style={{ color: "#7C3AED" }}>
                {showFullDesc ? "Voir moins" : "Lire la suite"}
              </button>
            )}
          </div>
        )}

        {/* Agenda */}
        <button
          onClick={() => setShowAgenda(true)}
          className="bg-white rounded-3xl p-4 shadow-sm flex items-center gap-3 text-left w-full transition-all hover:shadow-md active:scale-[0.98]"
          style={{ border: "1px solid #EDE9FE" }}
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#F5F3FF" }}>
            📅
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">Ajouter à mon agenda</p>
            <p className="text-xs text-gray-400">Google, Apple, Outlook, rappel email</p>
          </div>
          <span className="text-gray-300 text-xl">›</span>
        </button>

      </div>

      {/* ── BARRE BAS FIXE (prix + bouton) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-safe"
        style={{ zIndex: 40, background: "rgba(244,240,255,0.95)", backdropFilter: "blur(12px)", paddingBottom: "env(safe-area-inset-bottom, 16px)", borderTop: "1px solid #EDE9FE" }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3 py-3">
          {/* Prix */}
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 font-semibold">Prix</p>
            <p className={`font-black text-xl leading-none ${isGratuit ? "text-green-600" : "text-gray-900"}`}>
              {isGratuit ? "Gratuit" : evenement.prix}
            </p>
          </div>

          {/* Bouton principal */}
          <button
            onClick={participer}
            className="flex-1 py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.98] hover:opacity-90 flex flex-col items-center justify-center"
            style={{ background: hasParticipated ? "linear-gradient(135deg,#059669,#10B981)" : "linear-gradient(135deg,#7C3AED,#9333EA)", boxShadow: hasParticipated ? "0 6px 20px rgba(5,150,105,0.4)" : "0 6px 20px rgba(124,58,237,0.4)" }}
          >
            <span>{hasParticipated ? "✅ Je participe !" : "🎉 Je participe !"}</span>
            {participationCount > 0 && <span style={{ fontSize: 11, opacity: .8, fontWeight: 400 }}>{participationCount} participant{participationCount > 1 ? "s" : ""}</span>}
          </button>

          {/* Rappel */}
          <button
            onClick={demanderRappel}
            disabled={rappelEnvoye}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
            style={{ background: rappelEnvoye ? "#DCFCE7" : "#EDE9FE" }}
            title="Recevoir un rappel email J-1"
          >
            <span style={{ fontSize: 20 }}>{rappelEnvoye ? "✅" : "🔔"}</span>
          </button>
        </div>
      </div>

    </main>
  )
}
