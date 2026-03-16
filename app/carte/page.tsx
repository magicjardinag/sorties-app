"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"

const MapWithNoSSR = dynamic(() => import("@/components/Map"), { ssr: false })

type Evenement = {
  id: number
  titre: string
  categorie: string
  ville: string
  quand: string
  prix: string
  emoji: string
  lat: number
  lng: number
}

export default function Carte() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<Evenement[]>([])

  useEffect(() => {
    const fetchEvenements = async () => {
      const { data } = await supabase.from("evenements").select("*")
      setEvenements(data || [])
    }
    fetchEvenements()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center gap-4">
        <button onClick={() => router.push("/")} className="text-purple-600 hover:text-purple-800 font-medium text-sm">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp — Carte</h1>
      </header>
      <MapWithNoSSR evenements={evenements} />
    </main>
  )
}