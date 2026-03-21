"use client"

import { useState, useEffect, Suspense } from "react"
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

function CarteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null)
  const [rayon, setRayon] = useState(50)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [filtreProximite, setFiltreProximite] = useState(false)
  const [categorie, setCategorie] = useState("Tout")

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

  const evenementsFiltres = evenements.filter((e) => {
    const matchProximite = !filtreProximite || !position || !e.lat || !e.lng ||
      getDistance(position.lat, position.lng, e.lat, e.lng) <= rayon
    const matchCategorie = categorie === "Tout" ||
      (categorie === "Gratuit" ? e.prix === "Gratuit" : e.categorie === categorie)
    const matchDate = !e.quand || new Date(e.quand) >= today
    return matchProximite && matchCategorie && matchDate
  })

  const categories = ["Tout", "Musique", "Sport", "Culture", "Food", "Nature", "Gratuit"]

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-purple-600 hover:text-purple-800 font-medium text-sm">
            ← Retour
          </button>
          <h1 className="text-xl font-bold text-purple-600">SortiesApp — Carte</h1>
          {filtreProximite && (
            <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              {evenementsFiltres.length} événement{evenementsFiltres.length > 1 ? "s" : ""} dans {rayon} km
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="border border-gray-200 rounded-full px-3 py-2 text-sm text-gray-600 outline-none focus:border-purple-400"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {!filtreProximite ? (
            <button
              onClick={activerGeolocalisation}
              disabled={loadingGeo}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-300 text-purple-600 text-sm font-medium hover:bg-purple-50 transition-colors disabled:opacity-50"
            >
              {loadingGeo ? "⏳" : "📍"} Me localiser
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-purple-600 font-medium">📍 {rayon} km</span>
              <input type="range" min="5" max="200" step="5" value={rayon} onChange={(e) => setRayon(Number(e.target.value))} className="w-32"/>
              <button onClick={() => { setFiltreProximite(false); setPosition(null) }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
          )}
        </div>
      </header>
      <MapWithNoSSR evenements={evenementsFiltres} position={position} rayon={rayon}/>
    </main>
  )
}

export default function Carte() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Chargement...</div>}>
      <CarteContent />
    </Suspense>
  )
}