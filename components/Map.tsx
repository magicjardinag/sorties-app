"use client"

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const userIcon = L.divIcon({
  className: "",
  html: `<div style="background:#7c3aed;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #7c3aed;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

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

type Position = {
  lat: number
  lng: number
}

function CenterMap({ position }: { position: Position | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 11)
    }
  }, [position])
  return null
}

export default function Map({
  evenements,
  position,
  rayon,
}: {
  evenements: Evenement[]
  position?: Position | null
  rayon?: number
}) {
  const router = useRouter()

  return (
    <MapContainer
      center={[46.603354, 1.888334]}
      zoom={6}
      style={{ height: "calc(100vh - 65px)", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <CenterMap position={position || null} />

      {/* Position utilisateur */}
      {position && (
        <>
          <Marker position={[position.lat, position.lng]} icon={userIcon}>
            <Popup>
              <p style={{ fontWeight: "bold", margin: 0 }}>📍 Vous êtes ici</p>
            </Popup>
          </Marker>
          <Circle
            center={[position.lat, position.lng]}
            radius={(rayon || 50) * 1000}
            pathOptions={{ color: "#7c3aed", fillColor: "#7c3aed", fillOpacity: 0.05, weight: 2 }}
          />
        </>
      )}

      {/* Événements */}
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
  )
}