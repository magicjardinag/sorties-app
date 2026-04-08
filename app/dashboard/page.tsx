"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Evenement = {
  id: number
  titre: string
  categorie: string
  ville: string
  quand: string
  heure: string
  prix: string
  emoji: string
  statut: string
  image_url: string
  description: string
}

type Stats = { vues: number; participations: number; favoris: number }

const CATEGORIES = ["Musique","Sport","Danse","Culture","Atelier","Food","Nature & Rando","Animaux","Brocante","Bar & Nuit","Loto","Enfants","Autre"]

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const today = new Date(); today.setHours(0,0,0,0)
  const eventDate = new Date(dateStr); eventDate.setHours(0,0,0,0)
  const diffDays = Math.round((eventDate.getTime()-today.getTime())/(1000*60*60*24))
  if (diffDays < 0) return "Passé"
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Demain"
  return new Date(dateStr).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})
}

function getInitiales(email: string): string {
  return email?.slice(0, 2).toUpperCase() || "?"
}

function getAvatarColor(email: string): string {
  const colors = ["#FF4D00","#7C3AED","#059669","#0891B2","#DB2777","#D97706"]
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Dashboard() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [stats, setStats] = useState<Record<number, Stats>>({})
  const [totalStats, setTotalStats] = useState({ vues: 0, participations: 0, favoris: 0 })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [section, setSection] = useState<"profil"|"evenements"|"favoris"|"stats">("profil")
  const [editingId, setEditingId] = useState<number|null>(null)
  const [editForm, setEditForm] = useState<Partial<Evenement>>({})
  const [saving, setSaving] = useState(false)
  const [favorisEvts, setFavorisEvts] = useState<Evenement[]>([])
  const [loadingFavoris, setLoadingFavoris] = useState(false)
  const [participationsEvts, setParticipationsEvts] = useState<Evenement[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string|null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      setUser(user)

      const { data: evs } = await supabase.from("evenements").select("*").eq("user_id", user.id).order("quand", { ascending: true })
      const evList = evs || []
      setEvenements(evList)

      const statsMap: Record<number, Stats> = {}
      let totalV = 0, totalP = 0, totalF = 0
      for (const ev of evList) {
        const [vuesRes, partRes, favRes] = await Promise.all([
          supabase.from("vues_evenements").select("id", { count: "exact" }).eq("evenement_id", ev.id),
          supabase.from("participations").select("id", { count: "exact" }).eq("evenement_id", ev.id),
          supabase.from("favoris").select("id", { count: "exact" }).eq("evenement_id", ev.id),
        ])
        statsMap[ev.id] = { vues: vuesRes.count||0, participations: partRes.count||0, favoris: favRes.count||0 }
        totalV += vuesRes.count||0; totalP += partRes.count||0; totalF += favRes.count||0
      }
      setStats(statsMap)
      setTotalStats({ vues: totalV, participations: totalP, favoris: totalF })

      // Charger les favoris
      const { data: favData } = await supabase.from("favoris").select("evenement_id").eq("user_id", user.id)
      if (favData && favData.length > 0) {
        const ids = favData.map((f: any) => f.evenement_id)
        const { data: favEvts } = await supabase.from("evenements").select("*").in("id", ids)
        setFavorisEvts(favEvts || [])
      }

      // Charger les participations
      const { data: partData } = await supabase.from("participations").select("evenement_id").eq("user_id", user.id)
      if (partData && partData.length > 0) {
        const ids = partData.map((p: any) => p.evenement_id)
        const { data: partEvts } = await supabase.from("evenements").select("*").in("id", ids)
        setParticipationsEvts(partEvts || [])
      }

      // Charger avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle()
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)

      setLoading(false)
    }
    fetchData()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet événement ?")) return
    await supabase.from("evenements").delete().eq("id", id)
    setEvenements(evenements.filter(e => e.id !== id))
  }

  const handleEdit = (e: Evenement) => {
    setEditingId(e.id)
    setEditForm({ titre: e.titre, categorie: e.categorie, ville: e.ville, quand: e.quand, heure: e.heure||"", prix: e.prix, description: e.description||"", image_url: e.image_url||"" })
  }

  const handleSave = async (id: number) => {
    setSaving(true)
    await supabase.from("evenements").update({ ...editForm, statut: "en_attente" }).eq("id", id)
    setEvenements(evenements.map(e => e.id === id ? { ...e, ...editForm as any, statut: "en_attente" } : e))
    setEditingId(null); setSaving(false)
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split(".").pop()
      const path = `${user.id}/avatar.${ext}`
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
        const url = urlData.publicUrl + "?t=" + Date.now()
        setAvatarUrl(url)
        // Sauvegarder dans une table profiles
        await supabase.from("profiles").upsert({ id: user.id, avatar_url: url })
      }
    } catch (e) { console.error(e) }
    setUploadingAvatar(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const tauxConcretisation = totalStats.vues > 0 ? Math.round((totalStats.participations / totalStats.vues) * 100) : 0
  const membreDepuis = user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : ""

  const NAV = [
    { key: "profil", icon: "👤", label: "Profil" },
    { key: "evenements", icon: "📅", label: "Mes events", count: evenements.length },
    { key: "favoris", icon: "❤️", label: "Favoris", count: favorisEvts.length },
    { key: "stats", icon: "📊", label: "Stats" },
  ]

  return (
    <main className="min-h-screen pb-6" style={{ background: "#F7F6F2", fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          {user && (
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-sm font-black"
              style={{ background: avatarUrl ? "transparent" : getAvatarColor(user.email) }}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : getInitiales(user.email)}
            </div>
          )}
          <div>
            <h1 className="font-black text-base text-gray-900 leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>Mon espace</h1>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/")} className="px-3 py-2 rounded-full text-sm font-semibold text-gray-600 border border-gray-200">← Accueil</button>
          <button onClick={handleLogout} className="px-3 py-2 rounded-full text-sm font-semibold text-red-500 border border-red-200">Déco</button>
        </div>
      </header>

      {/* NAV TABS */}
      <div className="bg-white border-b border-gray-100 px-4 sticky top-14 z-10">
        <div className="flex gap-1 max-w-3xl mx-auto overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setSection(n.key as any)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
              style={{ borderColor: section === n.key ? "#FF4D00" : "transparent", color: section === n.key ? "#FF4D00" : "#9ca3af" }}>
              {n.icon} {n.label}
              {n.count !== undefined && n.count > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: section === n.key ? "#FF4D00" : "#f3f4f6", color: section === n.key ? "#fff" : "#6b7280" }}>{n.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">

        {/* ══ PROFIL ══ */}
        {section === "profil" && (
          <div className="flex flex-col gap-4">
            {/* Carte profil */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-20" style={{ background: user ? `linear-gradient(135deg, ${getAvatarColor(user.email)}, ${getAvatarColor(user.email)}99)` : "#FF4D00" }} />
              <div className="px-5 pb-5 -mt-8">
                <label className="relative cursor-pointer w-16 h-16 mb-3 block">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black border-4 border-white shadow-sm"
                      style={{ background: user ? getAvatarColor(user.email) : "#FF4D00" }}>
                      {user ? getInitiales(user.email) : "?"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-xs border border-gray-100">
                    {uploadingAvatar ? "⏳" : "📷"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleAvatarUpload(file)
                  }} />
                </label>
                <p className="font-black text-gray-900 text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {user?.email?.split("@")[0]}
                </p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">Membre depuis {membreDepuis}</p>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "📅", label: "Événements", value: evenements.length, color: "#FF4D00" },
                { icon: "❤️", label: "Favoris", value: favorisEvts.length, color: "#DB2777" },
                { icon: "🎉", label: "Participations", value: participationsEvts.length, color: "#7C3AED" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <p className="font-black text-xl mt-1" style={{ color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Participations récentes */}
            {participationsEvts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="font-black text-gray-900 mb-3 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>🎉 Mes participations</p>
                <div className="flex flex-col gap-2">
                  {participationsEvts.slice(0, 4).map(e => (
                    <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-orange-50 flex items-center justify-center text-lg">
                        {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover" /> : e.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{e.titre}</p>
                        <p className="text-gray-400 text-xs">{e.ville} · {formatDate(e.quand)}</p>
                      </div>
                      <span className="text-gray-300 text-sm">›</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button onClick={() => router.push("/publier")}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: "#FF4D00" }}>
                + Publier un événement
              </button>
              <button onClick={handleLogout}
                className="w-full py-3 rounded-2xl font-semibold text-red-500 text-sm border border-red-200 bg-white">
                Se déconnecter
              </button>
            </div>
          </div>
        )}

        {/* ══ ÉVÉNEMENTS ══ */}
        {section === "evenements" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-500">{evenements.length} événement{evenements.length > 1 ? "s" : ""}</p>
              <button onClick={() => router.push("/publier")} className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: "#FF4D00" }}>+ Publier</button>
            </div>
            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
              </div>
            ) : evenements.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-gray-500 mb-4 font-medium">Aucun événement publié</p>
                <button onClick={() => router.push("/publier")} className="px-6 py-3 rounded-full font-bold text-white" style={{ background: "#FF4D00" }}>
                  Publier mon premier événement
                </button>
              </div>
            ) : evenements.map(e => {
              const s = stats[e.id] || { vues: 0, participations: 0, favoris: 0 }
              const taux = s.vues > 0 ? Math.round((s.participations / s.vues) * 100) : 0
              const isPasse = e.quand && new Date(e.quand) < new Date()
              const isEditing = editingId === e.id
              return (
                <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      : <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">{e.emoji}</div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{e.titre}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${isPasse ? "bg-gray-100 text-gray-400" : e.statut === "approuve" ? "bg-green-100 text-green-600" : e.statut === "refuse" ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-600"}`}>
                          {isPasse ? "Passé" : e.statut === "approuve" ? "Publié" : e.statut === "refuse" ? "Refusé" : "En attente"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{e.ville} · <span style={{ color: "#FF4D00", fontWeight: 600 }}>{formatDate(e.quand)}</span> · {e.prix || "Gratuit"}</p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t border-orange-100 bg-orange-50 px-4 py-4 flex flex-col gap-3">
                      <p className="text-xs font-bold text-orange-700">✏️ Modifier — repassera en modération</p>
                      <input value={editForm.titre||""} onChange={ev => setEditForm({...editForm, titre: ev.target.value})} placeholder="Titre"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={editForm.ville||""} onChange={ev => setEditForm({...editForm, ville: ev.target.value})} placeholder="Ville"
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white" />
                        <input value={editForm.prix||""} onChange={ev => setEditForm({...editForm, prix: ev.target.value})} placeholder="Prix"
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white" />
                      </div>
                      <select value={editForm.categorie||""} onChange={ev => setEditForm({...editForm, categorie: ev.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={editForm.quand||""} onChange={ev => setEditForm({...editForm, quand: ev.target.value})}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white" />
                        <input type="time" value={editForm.heure||""} onChange={ev => setEditForm({...editForm, heure: ev.target.value})}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white" />
                      </div>
                      <textarea value={editForm.description||""} onChange={ev => setEditForm({...editForm, description: ev.target.value})}
                        rows={3} placeholder="Description" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none bg-white" />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white">Annuler</button>
                        <button onClick={() => handleSave(e.id)} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: "#FF4D00" }}>
                          {saving ? "⏳" : "💾 Sauver"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <>
                      <div className="border-t border-gray-50 px-4 py-3 flex items-center gap-4">
                        <span className="text-xs text-gray-500">👁️ <strong>{s.vues}</strong></span>
                        <span className="text-xs text-gray-500">🎉 <strong>{s.participations}</strong></span>
                        <span className="text-xs text-gray-500">❤️ <strong>{s.favoris}</strong></span>
                        {s.vues > 0 && <span className="ml-auto text-xs font-bold" style={{ color: "#059669" }}>📈 {taux}%</span>}
                      </div>
                      {s.vues > 0 && (
                        <div className="px-4 pb-3">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-1.5 rounded-full" style={{ width: `${Math.min(taux, 100)}%`, background: "linear-gradient(90deg,#FF4D00,#FF8C42)" }} />
                          </div>
                        </div>
                      )}
                      <div className="border-t border-gray-50 px-4 py-2 flex gap-2">
                        <button onClick={() => router.push(`/evenement/${e.id}`)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200">👁️ Voir</button>
                        <button onClick={() => handleEdit(e)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-blue-600 border border-blue-200">✏️ Modifier</button>
                        <button onClick={() => handleDelete(e.id)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200">🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ══ FAVORIS ══ */}
        {section === "favoris" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-500">{favorisEvts.length} favori{favorisEvts.length > 1 ? "s" : ""}</p>
            {favorisEvts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-5xl mb-4">❤️</p>
                <p className="text-gray-500 mb-4 font-medium">Aucun favori pour l'instant</p>
                <button onClick={() => router.push("/")} className="px-6 py-3 rounded-full font-bold text-white" style={{ background: "#FF4D00" }}>
                  Explorer les événements
                </button>
              </div>
            ) : favorisEvts.map(e => (
              <div key={e.id} onClick={() => router.push(`/evenement/${e.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-center gap-3 p-4">
                  {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    : <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">{e.emoji}</div>}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{e.titre}</h3>
                    <p className="text-xs text-gray-400">{e.ville} · <span style={{ color: "#FF4D00", fontWeight: 600 }}>{formatDate(e.quand)}</span></p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block" style={{ background: "#FEF3C7", color: "#92400e" }}>{e.categorie}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-lg">❤️</span>
                    <span className={`text-xs font-bold ${e.prix === "Gratuit" ? "text-green-600" : "text-gray-700"}`}>{e.prix || "Gratuit"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ STATS ══ */}
        {section === "stats" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "👁️", label: "Vues totales", value: totalStats.vues, color: "#7C3AED" },
                { icon: "🎉", label: "Participations", value: totalStats.participations, color: "#FF4D00" },
                { icon: "❤️", label: "Favoris reçus", value: totalStats.favoris, color: "#DB2777" },
                { icon: "📈", label: "Taux concrét.", value: `${tauxConcretisation}%`, color: "#059669" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <span className="font-black text-2xl" style={{ color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</span>
                  </div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {evenements.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-gray-900 mb-4 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Classement par vues</h2>
                <div className="flex flex-col gap-3">
                  {evenements.map(e => ({ ...e, ...(stats[e.id]||{vues:0,participations:0,favoris:0}) }))
                    .sort((a,b) => b.vues - a.vues).map((e, i) => (
                    <div key={e.id} className="flex items-center gap-3">
                      <span className="text-sm font-black text-gray-300 w-5">#{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{e.titre}</p>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-1.5 rounded-full" style={{ width: `${e.vues > 0 ? (e.vues / Math.max(...evenements.map(ev => stats[ev.id]?.vues||0), 1)) * 100 : 0}%`, background: "linear-gradient(90deg,#7C3AED,#9333EA)" }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-700 flex-shrink-0">{e.vues}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tauxConcretisation < 10 && totalStats.vues > 5 && (
              <div className="rounded-2xl p-4 border" style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
                <p className="text-sm font-bold text-orange-800 mb-1">💡 Conseil</p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  Taux de concrétisation de {tauxConcretisation}%. Améliore ta description, ajoute une photo et précise le prix.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}