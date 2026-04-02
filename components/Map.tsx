"use client"
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api"
import { useState, useEffect, useCallback } from "react"

const mapContainerStyle = { width: "100%", height: "100vh" }
const center = { lat: 46.603354, lng: 1.888334 }
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ]
}

type Evenement = { id: string; titre: string; categorie: string; ville: string; quand: string; prix: string; emoji: string; lat: number; lng: number }
type Position = { lat: number; lng: number }
type Bounds = { north: number; south: number; east: number; west: number }

export default function Map({
  evenements = [],
  position,
  rayon,
  onBoundsChange,
  onMarkerClick,
  selectedId,
}: {
  evenements: Evenement[]
  position?: Position | null
  rayon?: number
  onBoundsChange?: (bounds: Bounds) => void
  onMarkerClick?: (ev: Evenement) => void
  selectedId?: string
}) {
  const [mapCenter, setMapCenter] = useState(center)
  const [zoom, setZoom] = useState(6)
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null)
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY! })

  useEffect(() => {
    if (position) { setMapCenter(position); setZoom(10) }
  }, [position])

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map)
  }, [])

  const handleBoundsChanged = useCallback(() => {
    if (!mapRef || !onBoundsChange) return
    const bounds = mapRef.getBounds()
    if (!bounds) return
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    onBoundsChange({
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    })
  }, [mapRef, onBoundsChange])

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "#F7F6F2" }}>
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"/>
    </div>
  )

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={zoom}
      options={mapOptions}
      onLoad={onLoad}
      onBoundsChanged={handleBoundsChanged}
      onIdle={handleBoundsChanged}
    >
      {/* Position utilisateur */}
      {position && (
        <>
          <Marker
            position={position}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#FF4D00" stroke="white" stroke-width="3"/></svg>`)}`,
              scaledSize: { width: 24, height: 24 } as google.maps.Size,
              anchor: { x: 12, y: 12 } as google.maps.Point,
            }}
          />
          <Circle
            center={position}
            radius={(rayon || 50) * 1000}
            options={{
              fillColor: "#FF4D00",
              fillOpacity: 0.05,
              strokeColor: "#FF4D00",
              strokeOpacity: 0.2,
              strokeWeight: 2,
            }}
          />
        </>
      )}

      {/* Marqueurs événements */}
      {evenements.map((e) => e.lat && e.lng ? (
        <Marker
          key={e.id}
          position={{ lat: e.lat, lng: e.lng }}
          onClick={() => onMarkerClick?.(e)}
          icon={{
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              selectedId === e.id
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><circle cx="28" cy="28" r="26" fill="#FF4D00" stroke="white" stroke-width="3"/><text x="28" y="36" text-anchor="middle" font-size="24">${e.emoji}</text></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><circle cx="22" cy="22" r="20" fill="white" stroke="#e5e5e5" stroke-width="2"/><text x="22" y="29" text-anchor="middle" font-size="18">${e.emoji}</text></svg>`
            )}`,
            scaledSize: selectedId === e.id
              ? { width: 56, height: 56 } as google.maps.Size
              : { width: 44, height: 44 } as google.maps.Size,
            anchor: selectedId === e.id
              ? { x: 28, y: 28 } as google.maps.Point
              : { x: 22, y: 22 } as google.maps.Point,
          }}
          zIndex={selectedId === e.id ? 10 : 1}
        />
      ) : null)}
    </GoogleMap>
  )
}