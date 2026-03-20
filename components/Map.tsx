"use client"

import { GoogleMap, LoadScript, Marker, InfoWindow, Circle } from "@react-google-maps/api"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 65px)",
}

const center = {
  lat: 46.603354,
  lng: 1.888334,
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
}

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
  const [selected, setSelected] = useState<Evenement | null>(null)
  const [mapCenter, setMapCenter] = useState(center)
  const [zoom, setZoom] = useState(6)

  useEffect(() => {
    if (position) {
      setMapCenter(position)
      setZoom(10)
    }
  }, [position])

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={zoom}
        options={mapOptions}
      >
        {/* Position utilisateur */}
        {position && (
          <>
            <Marker
              position={position}
              icon={{
                path: "M-8,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0",
                fillColor: "#7c3aed",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
                scale: 1,
              }}
            />
            <Circle
              center={position}
              radius={(rayon || 50) * 1000}
              options={{
                fillColor: "#7c3aed",
                fillOpacity: 0.05,
                strokeColor: "#7c3aed",
                strokeOpacity: 0.4,
                strokeWeight: 2,
              }}
            />
          </>
        )}

        {/* Marqueurs événements */}
        {evenements.map((e) =>
          e.lat && e.lng ? (
            <Marker
              key={e.id}
              position={{ lat: e.lat, lng: e.lng }}
              onClick={() => setSelected(e)}
              label={{
                text: e.emoji,
                fontSize: "18px",
              }}
            />
          ) : null
        )}

        {/* Info popup */}
        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ padding: "4px", maxWidth: "200px" }}>
              <p style={{ fontSize: "20px", margin: "0 0 4px" }}>{selected.emoji}</p>
              <p style={{ fontWeight: "bold", margin: "0 0 2px", fontSize: "14px" }}>{selected.titre}</p>
              <p style={{ color: "#666", fontSize: "12px", margin: "0 0 2px" }}>{selected.ville} • {selected.quand}</p>
              <p style={{ color: "#7c3aed", fontSize: "12px", margin: "0 0 8px" }}>{selected.prix}</p>
              <button
                onClick={() => router.push(`/evenement/${selected.id}`)}
                style={{ background: "#7c3aed", color: "white", border: "none", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "12px" }}
              >
                Voir détails
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  )
}