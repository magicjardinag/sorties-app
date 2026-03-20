"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAIL = "a.giraudon@astem.fr"

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
  statut: string
  description: string
  image_url: string
  backup: any
}

const categories = ["Musique", "Sport", "Culture", "Food", "Nature", "Autre"]

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const today = new Date()
  const eventDate = new Date(dateStr)
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "⚠️ Passé"
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Demain"
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

function isPasse(dateStr: string): boolean {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateStr) < today
}

export default function Admin() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState("en_attente")
  const [selected, setSelected] = useState<Evenement | null>(null)
  const [recherche, setRecherche] = useState("")
  const [moderationEnCours, setModerationEnCours] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Evenement>>({})
  const [saving, setSaving] = useState(false)
  const [showBackup, setShowBackup] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/")
        return
      }
      fetchEvenements()
    }
    checkAdmin()
  }, [])

  const fetchEvenements = async () => {
    const { data } = await supabase
      .from("evenements")
      .select("*")
      .order("quand", { ascending: true })
    setEvenements(data || [])
    setLoading(false)
  }

  const handleStatut = async (id: string, statut: string, organisateur: string, titre: string) => {
    await fetch("/api/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, statut, organisateur, titre })
    })
    await fetchEvenements()
    setSelected(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet événement définitivement ?")) return
    await supabase.from("evenements").delete().eq("id", id)
    setEvenements(evenements.filter((e) => e.id !== id))
    setSelected(null)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)

    const backup = {
      titre: selected.titre,
      categorie: selected.categorie,
      ville: selected.ville,
      quand: selected.quand,
      heure: selected.heure,
      prix: selected.prix,
      description: selected.description,
      image_url: selected.image_url,
      saved_at: new Date().toISOString(),
    }

    await supabase.from("evenements").update({
      titre: editForm.titre,
      categorie: editForm.categorie,
      ville: editForm.ville,
      quand: editForm.quand,
      heure: editForm.heure,
      prix: editForm.prix,
      description: editForm.description,
      image_url: editForm.image_url,
      backup: backup,
    }).eq("id", selected.id)

    await fetchEvenements()
    setEditing(false)
    setSaving(false)
    alert("Événement modifié ! Backup sauvegardé ✅")
  }

  const handleRestore = async () => {
    if (!selected?.backup) return
    const b = selected.backup
    if (!confirm(`Restaurer la version du ${new Date(b.saved_at).toLocaleDateString("fr-FR")} ?`)) return
    await supabase.from("evenements").update({
      titre: b.titre,
      categorie: b.categorie,
      ville: b.ville,
      quand: b.quand,
      heure: b.heure,
      prix: b.prix,
      description: b.description,
      image_url: b.image_url,
      backup: null,
    }).eq("id", selected.id)
    await fetchEvenements()
    setShowBackup(false)
    setSelected(null)
    alert("Backup restauré !")
  }

  const toutApprouver = async () => {
    const enAttente = evenements.filter(e => e.statut === "en_attente")
    if (!confirm(`Approuver les ${enAttente.length} événements en attente ?`)) return
    setModerationEnCours(true)
    for (const e of enAttente) {
      await handleStatut(e.id, "approuve", e.organisateur, e.titre)
    }
    setModerationEnCours(false)
  }

  const moderationAuto = async () => {
    const enAttente = evenements.filter(e => e.statut === "en_attente")
    if (!confirm(`Lancer la modération automatique sur ${enAttente.length} événements ?`)) return
    setModerationEnCours(true)
    const motsCles = ["spam", "arnaque", "promo", "soldes", "publicité", "achetez", "cliquez", "gratuit gratuit"]
    for (const e of enAttente) {
      const contenu = `${e.titre} ${e.description || ""}`.toLowerCase()
      const isSpam = motsCles.some(m => contenu.includes(m))
      const titreTropCourt = e.titre.trim().length < 5
      const descriptionManquante = !e.description || e.description.trim().length < 10
      const statut = (isSpam || titreTropCourt || descriptionManquante) ? "refuse" : "approuve"
      await handleStatut(e.id, statut, e.organisateur, e.titre)
    }
    setModerationEnCours(false)
    alert("Modération automatique terminée !")
  }

  const evenementsFiltres = evenements.filter((e) => {
    const passe = isPasse(e.quand)
    if (filtre === "passe") return passe
    if (filtre === "tous") return true
    return e.statut === filtre && !passe
  }).filter((e) => {
    return e.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      e.ville.toLowerCase().includes(recherche.toLowerCase()) ||
      e.organisateur.toLowerCase().includes(recherche.toLowerCase())
  })

  const nbEnAttente = evenements.filter(e => e.statut === "en_attente" && !isPasse(e.quand)).length
  const nbPasse = evenements.filter(e => isPasse(e.quand)).length

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-purple-600">SortiesApp — Admin</h1>
          <p className="text-gray-500 text-sm">Panneau de modération</p>
        </div>
        <button onClick={() => router.push("/")} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">
          ← Retour au site
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFiltre("en_attente")}>
              <p className="text-2xl font-bold text-amber-500">{nbEnAttente}</p>
              <p className="text-gray-500 text-xs">En attente</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFiltre("approuve")}>
              <p className="text-2xl font-bold text-green-500">{evenements.filter(e => e.statut === "approuve" && !isPasse(e.quand)).length}</p>
              <p className="text-gray-500 text-xs">Approuvés</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFiltre("refuse")}>
              <p className="text-2xl font-bold text-red-500">{evenements.filter(e => e.statut === "refuse").length}</p>
              <p className="text-gray-500 text-xs">Refusés</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFiltre("passe")}>
              <p className="text-2xl font-bold text-gray-400">{nbPasse}</p>
              <p className="text-gray-500 text-xs">Passés</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-md" onClick={() => setFiltre("tous")}>
              <p className="text-2xl font-bold text-purple-500">{evenements.length}</p>
              <p className="text-gray-500 text-xs">Total</p>
            </div>
          </div>

          {nbEnAttente > 0 && (
            <div className="flex gap-3 mb-4">
              <button onClick={toutApprouver} disabled={moderationEnCours} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 disabled:opacity-50">
                ✅ Tout approuver ({nbEnAttente})
              </button>
              <button onClick={moderationAuto} disabled={moderationEnCours} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {moderationEnCours ? "⏳ En cours..." : `🤖 Modération auto (${nbEnAttente})`}
              </button>
            </div>
          )}

          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par titre, ville, organisateur..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400 mb-4 text-sm"
          />

          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: "en_attente", label: "⏳ En attente" },
              { key: "approuve", label: "✅ Approuvés" },
              { key: "refuse", label: "❌ Refusés" },
              { key: "passe", label: "🕰️ Passés" },
              { key: "tous", label: "🗂️ Tous" },
            ].map((s) => (
              <button key={s.key} onClick={() => setFiltre(s.key)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtre === s.key ? "bg-purple-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {s.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-4">⏳</p><p>Chargement...</p></div>
          ) : evenementsFiltres.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow text-gray-400"><p className="text-4xl mb-4">📭</p><p>Aucun événement</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {evenementsFiltres.map((e) => (
                <div key={e.id} onClick={() => { setSelected(e); setEditing(false); setShowBackup(false) }} className={`bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${selected?.id === e.id ? "ring-2 ring-purple-400" : ""} ${isPasse(e.quand) ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover"/> : <div className={`${e.couleur} w-full h-full flex items-center justify-center text-2xl`}>{e.emoji}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{e.titre}</h3>
                      <p className="text-gray-500 text-sm">{e.ville} • {formatDate(e.quand)}{e.heure ? ` à ${e.heure}` : ""}</p>
                      <p className="text-gray-400 text-xs truncate">Par {e.organisateur}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isPasse(e.quand) ? "bg-gray-100 text-gray-400" :
                        e.statut === "approuve" ? "bg-green-100 text-green-600" :
                        e.statut === "refuse" ? "bg-red-100 text-red-600" :
                        "bg-amber-100 text-amber-600"
                      }`}>
                        {isPasse(e.quand) ? "Passé" : e.statut === "en_attente" ? "En attente" : e.statut === "approuve" ? "Approuvé" : "Refusé"}
                      </span>
                      {e.backup && <span className="text-xs text-orange-400">💾 backup</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow p-6 sticky top-6 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">
                  {showBackup ? "💾 Backup" : editing ? "✏️ Modifier" : "Détail"}
                </h3>
                <button onClick={() => { setSelected(null); setEditing(false); setShowBackup(false) }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>

              {/* Vue Backup */}
              {showBackup && selected.backup && (
                <div className="flex flex-col gap-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                    Sauvegardé le {new Date(selected.backup.saved_at).toLocaleDateString("fr-FR")} à {new Date(selected.backup.saved_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {selected.backup.image_url && (
                    <img src={selected.backup.image_url} alt="backup" className="w-full h-28 object-cover rounded-lg"/>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-xs text-gray-400 mb-1">Titre</p>
                    <p className="text-gray-700">{selected.backup.titre}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-xs text-gray-400 mb-1">Ville • Date</p>
                    <p className="text-gray-700">{selected.backup.ville} • {formatDate(selected.backup.quand)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-xs text-gray-400 mb-1">Prix</p>
                    <p className="text-gray-700">{selected.backup.prix || "Gratuit"}</p>
                  </div>
                  {selected.backup.description && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="text-xs text-gray-400 mb-1">Description</p>
                      <p className="text-gray-700">{selected.backup.description}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setShowBackup(false)} className="w-full border border-gray-200 text-gray-600 py-2 rounded-full font-bold hover:bg-gray-50 text-sm">← Retour</button>
                    <button onClick={handleRestore} className="w-full bg-orange-500 text-white py-2 rounded-full font-bold hover:bg-orange-600 text-sm">↩ Restaurer</button>
                  </div>
                </div>
              )}

              {/* Vue Détail */}
              {!editing && !showBackup && (
                <>
                  {selected.image_url ? (
                    <img src={selected.image_url} alt={selected.titre} className="w-full h-40 object-cover rounded-lg mb-4"/>
                  ) : (
                    <div className={`${selected.couleur} w-full h-40 rounded-lg mb-4 flex items-center justify-center text-5xl`}>{selected.emoji}</div>
                  )}
                  <h4 className="font-bold text-gray-800 text-lg mb-1">{selected.titre}</h4>
                  <p className="text-gray-500 text-sm mb-1">📍 {selected.ville}</p>
                  <p className="text-gray-500 text-sm mb-1">📅 {formatDate(selected.quand)}{selected.heure ? ` à ${selected.heure}` : ""}</p>
                  <p className="text-gray-500 text-sm mb-1">🏷️ {selected.categorie}</p>
                  <p className={`text-sm font-medium mb-3 ${selected.prix === "Gratuit" ? "text-green-600" : "text-gray-800"}`}>💶 {selected.prix}</p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-400 mb-1">Organisateur</p>
                    <p className="text-sm text-gray-700">{selected.organisateur}</p>
                  </div>
                  {selected.description && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-400 mb-1">Description</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {selected.statut !== "approuve" && !isPasse(selected.quand) && (
                      <button onClick={() => handleStatut(selected.id, "approuve", selected.organisateur, selected.titre)} className="w-full bg-green-500 text-white py-2 rounded-full font-bold hover:bg-green-600 text-sm">✓ Approuver</button>
                    )}
                    {selected.statut !== "refuse" && !isPasse(selected.quand) && (
                      <button onClick={() => handleStatut(selected.id, "refuse", selected.organisateur, selected.titre)} className="w-full bg-amber-500 text-white py-2 rounded-full font-bold hover:bg-amber-600 text-sm">✗ Refuser</button>
                    )}
                    {selected.statut === "refuse" && (
                      <button onClick={() => handleStatut(selected.id, "approuve", selected.organisateur, selected.titre)} className="w-full bg-green-500 text-white py-2 rounded-full font-bold hover:bg-green-600 text-sm">↩ Réapprouver</button>
                    )}
                    {selected.backup && (
                      <button onClick={() => setShowBackup(true)} className="w-full border border-orange-300 text-orange-600 py-2 rounded-full font-bold hover:bg-orange-50 text-sm">
                        💾 Voir le backup
                      </button>
                    )}
                    <button
                      onClick={() => { setEditing(true); setEditForm({ titre: selected.titre, categorie: selected.categorie, ville: selected.ville, quand: selected.quand, heure: selected.heure, prix: selected.prix, description: selected.description, image_url: selected.image_url }) }}
                      className="w-full border border-blue-300 text-blue-600 py-2 rounded-full font-bold hover:bg-blue-50 text-sm"
                    >
                      ✏️ Modifier
                    </button>
                    <button onClick={() => router.push(`/evenement/${selected.id}`)} className="w-full border border-purple-300 text-purple-600 py-2 rounded-full font-bold hover:bg-purple-50 text-sm">👁️ Voir la page</button>
                    <button onClick={() => handleDelete(selected.id)} className="w-full bg-red-500 text-white py-2 rounded-full font-bold hover:bg-red-600 text-sm">🗑️ Supprimer</button>
                  </div>
                </>
              )}

              {/* Vue Édition */}
              {editing && !showBackup && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Titre</label>
                    <input value={editForm.titre || ""} onChange={(e) => setEditForm({...editForm, titre: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"/>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
                    <select value={editForm.categorie || ""} onChange={(e) => setEditForm({...editForm, categorie: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Ville</label>
                    <input value={editForm.ville || ""} onChange={(e) => setEditForm({...editForm, ville: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Date</label>
                      <input type="date" value={editForm.quand || ""} onChange={(e) => setEditForm({...editForm, quand: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Heure</label>
                      <input type="time" value={editForm.heure || ""} onChange={(e) => setEditForm({...editForm, heure: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix</label>
                    <input value={editForm.prix || ""} onChange={(e) => setEditForm({...editForm, prix: e.target.value})} placeholder="Ex: 10€ ou Gratuit" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"/>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <textarea value={editForm.description || ""} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 resize-none"/>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Image</label>
                    {editForm.image_url ? (
                      <div className="relative mb-2">
                        <img src={editForm.image_url} alt="preview" className="w-full h-28 object-cover rounded-lg"/>
                        <button onClick={() => setEditForm({...editForm, image_url: ""})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">✕</button>
                      </div>
                    ) : (
                      <label className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                        <span className="text-lg mb-1">📸</span>
                        <span className="text-xs text-gray-500">Changer l'image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const fileName = `${Date.now()}-${file.name}`
                          const { error } = await supabase.storage.from("evenements").upload(fileName, file)
                          if (!error) {
                            const { data: urlData } = supabase.storage.from("evenements").getPublicUrl(fileName)
                            setEditForm({...editForm, image_url: urlData.publicUrl})
                          }
                        }}/>
                      </label>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="w-full border border-gray-200 text-gray-600 py-2 rounded-full font-bold hover:bg-gray-50 text-sm">Annuler</button>
                    <button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 text-white py-2 rounded-full font-bold hover:bg-purple-700 text-sm disabled:opacity-50">
                      {saving ? "⏳" : "💾 Sauver"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}