"use client"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from "@react-google-maps/api"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const mapContainerStyle = { width: "100%", height: "calc(100vh - 65px)" }
const center = { lat: 46.603354, lng: 1.888334 }
const mapOptions = { disableDefaultUI: false, zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false }

type Evenement = { id: string; titre: string; categorie: string; ville: string; quand: string; prix: string; emoji: string; lat: number; lng: number }
type Position = { lat: number; lng: number }

export default function Map({ evenements = [], position, rayon }: { evenements: Evenement[]; position?: Position | null; rayon?: number }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Evenement | null>(null)
  const [mapCenter, setMapCenter] = useState(center)
  const [zoom, setZoom] = useState(6)
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY! })

  useEffect(() => { if (position) { setMapCenter(position); setZoom(10) } }, [position])

  if (!isLoaded) return <div className="flex items-center justify-center h-96 text-gray-400"><p>Chargement...</p></div>

  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={zoom} options={mapOptions}>
      {position && (
        <>
          <Marker position={position} icon={{ path: "M-8,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0", fillColor: "#FF4D00", fillOpacity: 1, strokeColor: "white", strokeWeight: 2, scale: 1 }}/>
          <Circle center={position} radius={(rayon || 50) * 1000} options={{ fillColor: "#FF4D00", fillOpacity: 0.05, strokeColor: "#FF4D00", strokeOpacity: 0.3, strokeWeight: 2 }}/>
        </>
      )}
      {evenements.map((e) => e.lat && e.lng ? (
        <Marker key={e.id} position={{ lat: e.lat, lng: e.lng }} onClick={() => setSelected(e)} label={{ text: e.emoji, fontSize: "18px" }}/>
      ) : null)}
      {selected && (
        <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
          <div style={{ padding: "12px", maxWidth: "220px", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "20px" }}>{selected.emoji}</span>
              <p style={{ fontWeight: "700", margin: "0", fontSize: "13px", color: "#1a1a1a" }}>{selected.titre}</p>
            </div>
            <p style={{ color: "#888", fontSize: "11px", margin: "0 0 4px" }}>{selected.ville}</p>
            <p style={{ color: "#888", fontSize: "11px", margin: "0 0 10px" }}>{selected.quand}</p>
            <button onClick={() => router.push(`/evenement/${selected.id}`)} style={{ background: "#FF4D00", color: "white", border: "none", padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: "600", width: "100%" }}>
              Voir l'événement →
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}