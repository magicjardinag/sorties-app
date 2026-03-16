"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { supabase } from "@/lib/supabase"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

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
        <button
          onClick={() => router.push("/")}
          className="text-purple-600 hover:text-purple-800 font-medium text-sm"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp — Carte</h1>
      </header>

      <MapContainer
        center={[46.603354, 1.888334]}
        zoom={6}
        style={{ height: "calc(100vh - 65px)", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {evenements.map((e) =>
          e.lat && e.lng ? (
            <Marker key={e.id} position={[e.lat, e.lng]} icon={icon}>
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <p style={{ fontSize: "20px", margin: "0 0 4px" }}>{e.emoji}</p>
                  <p style={{ fontWeight: "bold", margin: "0 0 2px" }}>{e.titre}</p>
                  <p style={{ color: "#666", fontSize: "13px", margin: "0 0 2px" }}>{e.ville} • {e.quand}</p>
                  <p style={{ color: "#7c3aed", fontSize: "13px", margin: "0 0 8px" }}>{e.prix}</p>
                  <button
                    onClick={() => router.push(`/evenement/${e.id}`)}
                    style={{ background: "#7c3aed", color: "white", border: "none", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "13px" }}
                  >
                    Voir détails
                  </button>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </main>
  )
}