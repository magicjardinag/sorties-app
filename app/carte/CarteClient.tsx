"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"

const MapWithNoSSR = dynamic(() => import("@/components/Map"), { ssr: false })

type Evenement = {
  id: string
  titre: string
  categorie: string
  ville: string
  quand: string
  prix: string
  emoji: string
  lat: number
  lng: number
  image_url?: string
}

type MapBounds = {
  north: number
  south: number
  east: number
  west: number
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
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  const diff = Math.round((d.getTime()-today.getTime())/(1000*60*60*24))
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return "Demain"
  return d.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})
}

const FALLBACK: Record<string, string> = {
  "Musique": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=70",
  "Sport": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=70",
  "Danse": "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400&q=70",
  "Culture": "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=70",
  "Atelier": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=70",
  "Food": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=70",
  "Nature & Rando": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=70",
  "Animaux": "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=70",
  "Brocante": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70",
  "Bar & Nuit": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=70",
  "Loto": "https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=400&q=70",
  "Enfants": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&q=70",
}

const categories = ["Tout", "Musique", "Sport", "Danse", "Culture", "Atelier", "Food", "Nature & Rando", "Animaux", "Brocante", "Bar & Nuit", "Loto", "Enfants", "Gratuit"]

export default function CarteClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null)
  const [rayon, setRayon] = useState(50)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [filtreProximite, setFiltreProximite] = useState(false)
  const [categorie, setCategorie] = useState("Tout")
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [evenementSelectionne, setEvenementSelectionne] = useState<Evenement | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [rechercheVille, setRechercheVille] = useState("")
  const [suggestionVilles, setSuggestionVilles] = useState<{nom: string, lat: number, lng: number}[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const rayonUrl = searchParams.get("rayon")
    const categorieUrl = searchParams.get("categorie")
    if (lat && lng) {
      setPosition({ lat: parseFloat(lat), lng: parseFloat(lng) })
      setFiltreProximite(true)
    }
    if (rayonUrl) setRayon(parseInt(rayonUrl))
    if (categorieUrl) setCategorie(categorieUrl)

    const fetchEvenements = async () => {
      const { data } = await supabase.from("evenements").select("*").eq("statut", "approuve")
      setEvenements(data || [])
    }
    fetchEvenements()
  }, [])

  const rechercherVille = async (query: string) => {
    setRechercheVille(query)
    if (query.length < 2) { setSuggestionVilles([]); return }
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${query}&fields=nom,centre&limit=5`)
      const data = await res.json()
      setSuggestionVilles(data.map((c: any) => ({
        nom: c.nom,
        lat: c.centre?.coordinates?.[1] || 0,
        lng: c.centre?.coordinates?.[0] || 0,
      })))
    } catch {}
  }

  const selectionnerVille = (ville: {nom: string, lat: number, lng: number}) => {
    setPosition({ lat: ville.lat, lng: ville.lng })
    setFiltreProximite(true)
    setRechercheVille(ville.nom)
    setSuggestionVilles([])
  }

  const activerGeolocalisation = () => {
    setLoadingGeo(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setFiltreProximite(true)
        setLoadingGeo(false)
      },
      () => {
        alert("Impossible d'accéder à ta position.")
        setLoadingGeo(false)
      }
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Événements filtrés par catégorie, proximité et date
  const evenementsFiltres = evenements.filter((e) => {
    const matchProximite = !filtreProximite || !position || !e.lat || !e.lng ||
      getDistance(position.lat, position.lng, e.lat, e.lng) <= rayon
    const matchCategorie = categorie === "Tout" ||
      (categorie === "Gratuit" ? e.prix === "Gratuit" : e.categorie === categorie)
    const matchDate = !e.quand || new Date(e.quand) >= today
    return matchProximite && matchCategorie && matchDate
  })

  // Événements visibles dans la zone de la carte
  const evenementsVisibles = mapBounds
    ? evenementsFiltres.filter(e =>
        e.lat && e.lng &&
        e.lat <= mapBounds.north && e.lat >= mapBounds.south &&
        e.lng <= mapBounds.east && e.lng >= mapBounds.west
      )
    : evenementsFiltres

  const handleMarkerClick = useCallback((ev: Evenement) => {
    setEvenementSelectionne(ev)
    // Scroll vers la carte de l'événement dans le carrousel
    if (carouselRef.current) {
      const idx = evenementsVisibles.findIndex(e => e.id === ev.id)
      if (idx >= 0) {
        const cardWidth = 200
        carouselRef.current.scrollTo({ left: idx * (cardWidth + 12), behavior: "smooth" })
      }
    }
  }, [evenementsVisibles])

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ background: "#F7F6F2" }}>

      {/* ── HEADER FLOTTANT ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center gap-2">
        <button onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
          ←
        </button>

        <div className="flex-1 relative">
          <div className="bg-white rounded-full shadow-md flex items-center px-4 py-2.5 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Rechercher une ville..."
              value={rechercheVille}
              onChange={(e) => rechercherVille(e.target.value)}
              className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder-gray-400"
            />
            {rechercheVille && (
              <button onClick={() => { setRechercheVille(""); setSuggestionVilles([]) }} className="text-gray-400 text-xs">✕</button>
            )}
          </div>
          {suggestionVilles.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl overflow-hidden z-30">
              {suggestionVilles.map((v, i) => (
                <button key={i} onClick={() => selectionnerVille(v)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-2">
                  <span className="text-gray-400">📍</span>
                  {v.nom}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={activerGeolocalisation} disabled={loadingGeo}
          className="w-10 h-10 rounded-full shadow-md flex items-center justify-center flex-shrink-0 font-bold transition-all"
          style={{ background: filtreProximite ? "#FF4D00" : "#fff", color: filtreProximite ? "#fff" : "#555" }}>
          {loadingGeo ? "⏳" : "📍"}
        </button>

        <button onClick={() => setShowFilters(!showFilters)}
          className="w-10 h-10 rounded-full shadow-md flex items-center justify-center flex-shrink-0"
          style={{ background: categorie !== "Tout" ? "#FF4D00" : "#fff", color: categorie !== "Tout" ? "#fff" : "#555" }}>
          ⚙️
        </button>
      </div>

      {/* ── FILTRES DÉROULANTS ── */}
      {showFilters && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-white rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-900 text-sm">Filtres</p>
            <button onClick={() => setShowFilters(false)} className="text-gray-400">✕</button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(c => (
              <button key={c} onClick={() => { setCategorie(c); setShowFilters(false) }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  background: categorie === c ? "#FF4D00" : "#fff",
                  color: categorie === c ? "#fff" : "#555",
                  borderColor: categorie === c ? "#FF4D00" : "#e5e5e5"
                }}>
                {c}
              </button>
            ))}
          </div>
          {filtreProximite && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Rayon : {rayon} km</span>
              <input type="range" min="5" max="200" step="5" value={rayon}
                onChange={(e) => setRayon(Number(e.target.value))} className="flex-1"/>
              <button onClick={() => { setFiltreProximite(false); setPosition(null) }}
                className="text-xs text-red-400 underline">Désactiver</button>
            </div>
          )}
        </div>
      )}

      {/* ── CARTE PLEIN ÉCRAN ── */}
      <div className="absolute inset-0">
        <MapWithNoSSR
          evenements={evenementsFiltres}
          position={position}
          rayon={rayon}
          onBoundsChange={setMapBounds}
          onMarkerClick={handleMarkerClick}
          selectedId={evenementSelectionne?.id}
        />
      </div>

      {/* ── CARROUSEL ÉVÉNEMENTS EN BAS ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-6 pt-2">
        {/* Compteur */}
        <div className="px-4 mb-2">
          <span className="bg-white/90 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-gray-700 shadow-sm">
            {evenementsVisibles.length} événement{evenementsVisibles.length > 1 ? "s" : ""} dans cette zone
          </span>
        </div>

        {/* Carrousel */}
        <div ref={carouselRef}
          className="flex gap-3 overflow-x-auto px-4 pb-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {evenementsVisibles.length === 0 ? (
            <div className="bg-white rounded-2xl px-6 py-4 shadow-md text-sm text-gray-400 flex-shrink-0">
              Aucun événement dans cette zone
            </div>
          ) : (
            evenementsVisibles.map(ev => (
              <div
                key={ev.id}
                onClick={() => router.push(`/evenement/${ev.id}`)}
                className="flex-shrink-0 bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer transition-all active:scale-95"
                style={{
                  width: 190,
                  border: evenementSelectionne?.id === ev.id ? "2px solid #FF4D00" : "2px solid transparent"
                }}>
                {/* Image */}
                <div className="h-28 relative overflow-hidden">
                  <img
                    src={ev.image_url || FALLBACK[ev.categorie] || FALLBACK["Musique"]}
                    alt={ev.titre}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK[ev.categorie] || FALLBACK["Musique"] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                  <span className="absolute bottom-2 left-2 text-xs font-bold text-white px-2 py-0.5 rounded-full"
                    style={{ background: ev.prix === "Gratuit" ? "#22c55e" : "rgba(0,0,0,0.5)" }}>
                    {ev.prix || "Gratuit"}
                  </span>
                </div>
                {/* Infos */}
                <div className="p-3">
                  <p className="font-bold text-gray-900 text-xs leading-tight line-clamp-2 mb-1">{ev.titre}</p>
                  <p className="text-xs text-gray-400 truncate">📍 {ev.ville}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: "#FF4D00" }}>
                    {formatDate(ev.quand)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </main>
  )
}