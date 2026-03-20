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
    action: "TEMPLATE",
    text: evenement.titre,
    dates: `${heureDebut}/${heureFin}`,
    details: evenement.description || "",
    location: evenement.ville,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export default function EvenementDetail() {
  const router = useRouter()
  const params = useParams()
  const [evenement, setEvenement] = useState<Evenement | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAffiche, setShowAffiche] = useState(false)
  const [rappelEnvoye, setRappelEnvoye] = useState(false)
  const [user, setUser] = useState<any>(null)

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

  const telechargerICS = () => {
    if (!evenement) return
    const ics = genererICS(evenement)
    const blob = new Blob([ics], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${evenement.titre}.ics`
    a.click()
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
          email: user.email,
          titre: evenement.titre,
          ville: evenement.ville,
          quand: evenement.quand,
          heure: evenement.heure,
          prix: evenement.prix,
          evenement_id: evenement.id,
          image_url: evenement.image_url,
          lat: evenement.lat,
          lng: evenement.lng,
          description: evenement.description,
        })
      })
      setRappelEnvoye(true)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-4">⏳</p>
          <p>Chargement...</p>
        </div>
      </main>
    )
  }

  if (!evenement) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-500">Événement introuvable</p>
          <button onClick={() => router.push("/")} className="mt-4 text-purple-600 font-medium">← Retour à l'accueil</button>
        </div>
      </main>
    )
  }

  const lienMaps = evenement.lat && evenement.lng
    ? `https://www.google.com/maps?q=${evenement.lat},${evenement.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(evenement.ville || "")}`

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="relative h-96 w-full overflow-hidden">
        {evenement.image_url ? (
          <img src={evenement.image_url} alt={evenement.titre} className="w-full h-full object-cover"/>
        ) : (
          <div className={`${evenement.couleur} w-full h-full flex items-center justify-center text-8xl`}>{evenement.emoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
        <button onClick={() => router.back()} className="absolute top-5 left-5 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
          ← Retour
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full mb-3 inline-block">{evenement.categorie}</span>
          <h1 className="text-4xl font-bold text-white mb-2">{evenement.titre}</h1>
          <p className="text-white/80 text-lg">{evenement.ville} · {evenement.quand}</p>
        </div>
      </div>

      {showAffiche && (
        <div onClick={() => setShowAffiche(false)} onMouseLeave={() => setShowAffiche(false)} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">✕</button>
          <img src={evenement.image_url} alt={evenement.titre} className="max-h-screen max-w-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 grid grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Date</p>
            <p className="font-semibold text-gray-900">{evenement.quand}{evenement.heure ? `, ${evenement.heure}` : ""}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Lieu</p>
            <p className="font-semibold text-gray-900">{evenement.ville}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Prix</p>
            <p className={`font-semibold text-lg ${evenement.prix === "Gratuit" ? "text-green-500" : "text-gray-900"}`}>{evenement.prix}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Organisateur</p>
            <p className="font-semibold text-gray-900">{evenement.organisateur}</p>
          </div>
        </div>

        <button
          onClick={() => window.open(lienMaps, "_blank")}
          className="flex items-center gap-4 w-full bg-white rounded-2xl shadow-sm p-5 mb-5 hover:shadow-md transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📍</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{evenement.ville}</p>
            <p className="text-green-600 text-sm">Appuyer pour ouvrir dans Google Maps →</p>
          </div>
          <span className="text-gray-400 text-xl">›</span>
        </button>

        {evenement.description && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-5">
            <h3 className="font-bold text-gray-900 mb-3">À propos</h3>
            <p className="text-gray-600 leading-relaxed">{evenement.description}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">📅 Ajouter à mon agenda</h3>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.open(genererLienGoogleCalendar(evenement), "_blank")} className="flex items-center gap-3 w-full border border-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
              <span className="text-xl">📅</span> Google Calendar
            </button>
            <button onClick={telechargerICS} className="flex items-center gap-3 w-full border border-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
              <span className="text-xl">🍎</span> Apple / Outlook Calendar (.ics)
            </button>
            <button
              onClick={demanderRappel}
              disabled={rappelEnvoye}
              className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-colors text-sm font-medium ${rappelEnvoye ? "bg-green-50 text-green-600 border border-green-200" : "bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100"}`}
            >
              <span className="text-xl">{rappelEnvoye ? "✅" : "🔔"}</span>
              {rappelEnvoye ? "Rappel email confirmé !" : "Recevoir un rappel par email (J-1)"}
            </button>
          </div>
        </div>

        <button className="w-full bg-purple-600 text-white py-4 rounded-2xl text-lg font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
          Je participe ! 🎉
        </button>

        {evenement.image_url && (
          <div className="mt-8">
            <p className="text-gray-400 text-sm mb-3">🖼️ Affiche de l'événement</p>
            <div onClick={() => setShowAffiche(true)} onMouseEnter={() => setShowAffiche(true)} className="relative w-32 cursor-pointer group">
              <img src={evenement.image_url} alt="affiche" className="w-32 h-44 object-cover rounded-xl shadow-md group-hover:shadow-xl group-hover:scale-150 group-hover:-translate-y-8 transition-all duration-300 origin-bottom-left"/>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}