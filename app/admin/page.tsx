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

type Pub = {
  id: string
  nom_commerce: string
  description: string
  image_url: string
  lien: string
  ville: string
  actif: boolean
  lat: number
  lng: number
  rayon: number
}

const ALL_CATEGORIES = ["Musique","Sport","Danse","Culture","Atelier","Food","Nature & Rando","Animaux","Brocante","Bar & Nuit","Loto","Enfants","Autre"]

const HERO_SLOGANS_DEFAULT: Record<string, string> = {
  "Musique": "Tes oreilles méritent mieux que Spotify.",
  "Sport": "Ton canapé survivra sans toi ce soir.",
  "Nature & Rando": "La nature existe aussi en vrai, paraît-il.",
  "Culture": "Sors, t'auras l'air cultivé au bureau lundi.",
  "Food": "Tu peux pas manger pareil chez toi. Promis.",
  "Danse": "Personne juge. Enfin presque.",
  "Bar & Nuit": "Un verre dehors, ça compte comme du social.",
  "Atelier": "Crée un truc. Même raté c'est sympa.",
  "Enfants": "Épuise-les dehors. Dors mieux ce soir.",
  "Animaux": "Ton chien a besoin de toi. (C'est lui qui le dit.)",
  "Brocante": "Achète des trucs dont t'as pas besoin. Avec style.",
  "Loto": "Ce soir c'est peut-être toi. (C'est pas toi.)",
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const today = new Date(); today.setHours(0,0,0,0)
  const eventDate = new Date(dateStr); eventDate.setHours(0,0,0,0)
  const diffDays = Math.round((eventDate.getTime()-today.getTime())/(1000*60*60*24))
  if (diffDays < 0) return "⚠️ Passé"
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Demain"
  return new Date(dateStr).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})
}

function isPasse(dateStr: string): boolean {
  if (!dateStr) return false
  const today = new Date(); today.setHours(0,0,0,0)
  return new Date(dateStr) < today
}

// ── Composant stat card ──
function StatCard({ label, value, color, icon, onClick, active }: { label: string; value: number | string; color: string; icon: string; onClick?: () => void; active?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 border transition-all ${onClick ? "cursor-pointer hover:shadow-md" : ""} ${active ? "border-orange-400 shadow-md" : "border-gray-100"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-black ${color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{value}</span>
      </div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  )
}

// ── Composant nav item sidebar ──
function NavItem({ icon, label, active, onClick, badge }: { icon: string; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${active ? "text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
      style={active ? { background: "linear-gradient(135deg,#FF4D00,#FF8C42)" } : {}}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/30 text-white" : "bg-orange-100 text-orange-600"}`}>{badge}</span>
      )}
    </button>
  )
}

export default function Admin() {
  const router = useRouter()
  const [section, setSection] = useState<"dashboard"|"evenements"|"pubs"|"utilisateurs"|"analytics"|"categories"|"parametres"|"rappels"|"alaune">("dashboard")

  // ── Événements ──
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState("en_attente")
  const [selected, setSelected] = useState<Evenement | null>(null)
  const [recherche, setRecherche] = useState("")
  const [moderationEnCours, setModerationEnCours] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Evenement>>({})
  const [saving, setSaving] = useState(false)
  const [showBackup, setShowBackup] = useState(false)

  // ── Pubs ──
  const [pubs, setPubs] = useState<Pub[]>([])
  const [selectedPub, setSelectedPub] = useState<Pub | null>(null)
  const [editingPub, setEditingPub] = useState(false)
  const [pubForm, setPubForm] = useState<Partial<Pub>>({})
  const [savingPub, setSavingPub] = useState(false)
  const [newPub, setNewPub] = useState(false)

  // ── Utilisateurs ──
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // ── Rappels ──
  const [rappels, setRappels] = useState<any[]>([])

  // ── Mise en avant ──
  const [spotlightIds, setSpotlightIds] = useState<string[]>([])

  // ── Paramètres ──
  const [slogans, setSlogans] = useState<Record<string, string>>(HERO_SLOGANS_DEFAULT)
  const [savingParams, setSavingParams] = useState(false)
  const [paramsSaved, setParamsSaved] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.back()
        return
      }
      setIsAuthorized(true)
      setCheckingAuth(false)
      fetchEvenements()
      fetchPubs()
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (section === "utilisateurs" && users.length === 0) fetchUsers()
    if (section === "rappels" && rappels.length === 0) fetchRappels()
  }, [section])

  const fetchEvenements = async () => {
    const { data } = await supabase.from("evenements").select("*").order("quand",{ascending:true})
    setEvenements(data || [])
    setLoading(false)
  }

  const fetchPubs = async () => {
    const { data } = await supabase.from("publicites").select("*").order("nom_commerce",{ascending:true})
    setPubs(data || [])
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    const { data } = await supabase.from("favoris").select("user_id").limit(100)
    const uniqueIds = [...new Set((data || []).map((f: any) => f.user_id))]
    setUsers(uniqueIds.map(id => ({ id, favoris: (data || []).filter((f: any) => f.user_id === id).length })))
    setLoadingUsers(false)
  }

  const fetchRappels = async () => {
    const { data } = await supabase.from("rappels").select("*").order("created_at",{ascending:false}).limit(50)
    setRappels(data || [])
  }

  // ── Handlers événements ──
  const handleStatut = async (id: string, statut: string, organisateur: string, titre: string) => {
    await fetch("/api/moderation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,statut,organisateur,titre})})
    await fetchEvenements()
    setSelected(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet événement définitivement ?")) return
    await supabase.from("evenements").delete().eq("id",id)
    setEvenements(evenements.filter(e => e.id !== id))
    setSelected(null)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    const backup = { titre:selected.titre, categorie:selected.categorie, ville:selected.ville, quand:selected.quand, heure:selected.heure, prix:selected.prix, description:selected.description, image_url:selected.image_url, saved_at:new Date().toISOString() }
    await supabase.from("evenements").update({ titre:editForm.titre, categorie:editForm.categorie, ville:editForm.ville, quand:editForm.quand, heure:editForm.heure, prix:editForm.prix, description:editForm.description, image_url:editForm.image_url, backup }).eq("id",selected.id)
    await fetchEvenements()
    setEditing(false); setSaving(false)
    alert("Événement modifié ✅")
  }

  const handleRestore = async () => {
    if (!selected?.backup) return
    const b = selected.backup
    if (!confirm(`Restaurer la version du ${new Date(b.saved_at).toLocaleDateString("fr-FR")} ?`)) return
    await supabase.from("evenements").update({ titre:b.titre, categorie:b.categorie, ville:b.ville, quand:b.quand, heure:b.heure, prix:b.prix, description:b.description, image_url:b.image_url, backup:null }).eq("id",selected.id)
    await fetchEvenements(); setShowBackup(false); setSelected(null)
    alert("Backup restauré !")
  }

  const toutApprouver = async () => {
    const enAttente = evenements.filter(e => e.statut === "en_attente")
    if (!confirm(`Approuver les ${enAttente.length} événements en attente ?`)) return
    setModerationEnCours(true)
    for (const e of enAttente) await handleStatut(e.id,"approuve",e.organisateur,e.titre)
    setModerationEnCours(false)
  }

  const moderationAuto = async () => {
    const enAttente = evenements.filter(e => e.statut === "en_attente")
    if (!confirm(`Lancer la modération automatique sur ${enAttente.length} événements ?`)) return
    setModerationEnCours(true)
    const motsCles = ["spam","arnaque","promo","soldes","publicité","achetez","cliquez","gratuit gratuit"]
    for (const e of enAttente) {
      const contenu = `${e.titre} ${e.description||""}`.toLowerCase()
      const isSpam = motsCles.some(m => contenu.includes(m))
      const statut = (isSpam||e.titre.trim().length<5||!e.description||e.description.trim().length<10)?"refuse":"approuve"
      await handleStatut(e.id,statut,e.organisateur,e.titre)
    }
    setModerationEnCours(false)
    alert("Modération automatique terminée !")
  }

  // ── Handlers pubs ──
  const savePub = async () => {
    setSavingPub(true)
    const payload = { nom_commerce:pubForm.nom_commerce, description:pubForm.description, image_url:pubForm.image_url||"", lien:pubForm.lien||"", ville:pubForm.ville||"", actif:pubForm.actif??true, lat:pubForm.lat||null, lng:pubForm.lng||null, rayon:pubForm.rayon||50 }
    if (newPub) await supabase.from("publicites").insert(payload)
    else if (selectedPub) await supabase.from("publicites").update(payload).eq("id",selectedPub.id)
    await fetchPubs()
    setEditingPub(false); setNewPub(false); setSelectedPub(null); setSavingPub(false)
    alert("Publicité sauvegardée !")
  }

  const deletePub = async (id: string) => {
    if (!confirm("Supprimer cette publicité ?")) return
    await supabase.from("publicites").delete().eq("id",id)
    setPubs(pubs.filter(p => p.id !== id)); setSelectedPub(null)
  }

  const toggleActif = async (pub: Pub) => {
    await supabase.from("publicites").update({actif:!pub.actif}).eq("id",pub.id)
    await fetchPubs()
  }

  // ── Filtres événements ──
  const evenementsFiltres = evenements.filter(e => {
    const passe = isPasse(e.quand)
    if (filtre === "passe") return passe
    if (filtre === "tous") return true
    return e.statut === filtre && !passe
  }).filter(e =>
    e.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    e.ville.toLowerCase().includes(recherche.toLowerCase()) ||
    e.organisateur.toLowerCase().includes(recherche.toLowerCase())
  )

  const nbEnAttente = evenements.filter(e => e.statut==="en_attente"&&!isPasse(e.quand)).length
  const nbApprouves = evenements.filter(e => e.statut==="approuve"&&!isPasse(e.quand)).length
  const nbRefuses = evenements.filter(e => e.statut==="refuse").length
  const nbPasse = evenements.filter(e => isPasse(e.quand)).length

  // ── Stats analytics ──
  const totalFavoris = users.reduce((acc, u) => acc + u.favoris, 0)
  const catStats = ALL_CATEGORIES.map(cat => ({
    cat,
    count: evenements.filter(e => e.categorie === cat && !isPasse(e.quand)).length
  })).sort((a,b) => b.count - a.count).slice(0,6)

  const saveParams = async () => {
    setSavingParams(true)
    // Stockage des slogans dans localStorage (côté client) ou une table de config
    // Pour une solution simple on peut utiliser une table "config" dans Supabase
    // Ici on stocke en localStorage comme exemple
    localStorage.setItem("admin_slogans", JSON.stringify(slogans))
    setTimeout(() => { setSavingParams(false); setParamsSaved(true); setTimeout(() => setParamsSaved(false), 2000) }, 600)
  }

  if (checkingAuth || !isAuthorized) return null

  return (
    <div className="flex min-h-screen" style={{ background: "#F7F6F2", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black" style={{ background: "#FF4D00" }}>S</div>
            <div>
              <p className="font-black text-gray-900 text-sm leading-none">SortiesApp</p>
              <p className="text-[10px] text-orange-500 font-semibold">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <NavItem icon="📊" label="Dashboard" active={section==="dashboard"} onClick={() => setSection("dashboard")} />
          <div className="h-px bg-gray-100 my-2" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">Contenu</p>
          <NavItem icon="📅" label="Événements" active={section==="evenements"} onClick={() => setSection("evenements")} badge={nbEnAttente} />
          <NavItem icon="📢" label="Publicités" active={section==="pubs"} onClick={() => setSection("pubs")} badge={pubs.filter(p=>p.actif).length} />
          <NavItem icon="🔥" label="À la une" active={section==="alaune"} onClick={() => setSection("alaune")} />
          <div className="h-px bg-gray-100 my-2" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">Gestion</p>
          <NavItem icon="👥" label="Utilisateurs" active={section==="utilisateurs"} onClick={() => setSection("utilisateurs")} />
          <NavItem icon="🔔" label="Rappels email" active={section==="rappels"} onClick={() => setSection("rappels")} />
          <NavItem icon="🏷️" label="Catégories" active={section==="categories"} onClick={() => setSection("categories")} />
          <div className="h-px bg-gray-100 my-2" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">Analyse</p>
          <NavItem icon="📈" label="Analytics" active={section==="analytics"} onClick={() => setSection("analytics")} />
          <div className="h-px bg-gray-100 my-2" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">Réglages</p>
          <NavItem icon="⚙️" label="Paramètres" active={section==="parametres"} onClick={() => setSection("parametres")} />
        </nav>

        {/* Footer sidebar */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={() => router.push("/")} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
            <span>←</span> Voir le site
          </button>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ── */}
      <main className="flex-1 overflow-auto">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-black text-gray-900 text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                {section === "dashboard" && "Dashboard"}
                {section === "evenements" && "Événements"}
                {section === "pubs" && "Publicités"}
                {section === "utilisateurs" && "Utilisateurs"}
                {section === "analytics" && "Analytics"}
                {section === "categories" && "Catégories"}
                {section === "parametres" && "Paramètres du site"}
                {section === "rappels" && "Rappels email"}
                {section === "alaune" && "À la une"}
              </h1>
              <p className="text-xs text-gray-400">Admin · {ADMIN_EMAIL}</p>
            </div>
            {nbEnAttente > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-orange-600" style={{ background: "#FFF7ED" }}>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
                {nbEnAttente} en attente de modération
              </div>
            )}
          </div>
        </div>

        <div className="p-6">

          {/* ══ DASHBOARD ══ */}
          {section === "dashboard" && (
            <div className="flex flex-col gap-6">
              {/* Stats principales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="En attente" value={nbEnAttente} color="text-amber-500" icon="⏳" onClick={() => { setSection("evenements"); setFiltre("en_attente") }} active={false} />
                <StatCard label="Approuvés" value={nbApprouves} color="text-green-500" icon="✅" onClick={() => { setSection("evenements"); setFiltre("approuve") }} />
                <StatCard label="Publicités actives" value={pubs.filter(p=>p.actif).length} color="text-blue-500" icon="📢" onClick={() => setSection("pubs")} />
                <StatCard label="Événements total" value={evenements.length} color="text-orange-500" icon="📅" onClick={() => { setSection("evenements"); setFiltre("tous") }} />
              </div>

              {/* Actions rapides */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Actions rapides</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: "✅", label: `Tout approuver (${nbEnAttente})`, color: "#22c55e", bg: "#DCFCE7", onClick: toutApprouver, disabled: nbEnAttente === 0 },
                    { icon: "🤖", label: "Modération auto", color: "#7C3AED", bg: "#EDE9FE", onClick: moderationAuto, disabled: nbEnAttente === 0 },
                    { icon: "➕", label: "Nouvelle pub", color: "#FF4D00", bg: "#FEF3C7", onClick: () => { setSection("pubs"); setNewPub(true); setEditingPub(true); setPubForm({ actif: true, rayon: 50 }) } },
                    { icon: "⚙️", label: "Paramètres", color: "#0891B2", bg: "#E0F2FE", onClick: () => setSection("parametres") },
                  ].map((a, i) => (
                    <button key={i} onClick={a.onClick} disabled={a.disabled}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                      style={{ background: a.bg, color: a.color }}>
                      <span style={{ fontSize: 24 }}>{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Derniers événements en attente */}
              {nbEnAttente > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>En attente de modération</h2>
                    <button onClick={() => setSection("evenements")} className="text-xs font-bold" style={{ color: "#FF4D00" }}>Voir tout →</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {evenements.filter(e => e.statut==="en_attente"&&!isPasse(e.quand)).slice(0,5).map(e => (
                      <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => { setSection("evenements"); setSelected(e); setFiltre("en_attente") }}>
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                          {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover"/> : <div className={`${e.couleur} w-full h-full flex items-center justify-center text-lg`}>{e.emoji}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{e.titre}</p>
                          <p className="text-xs text-gray-400">{e.ville} · {formatDate(e.quand)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={ev => { ev.stopPropagation(); handleStatut(e.id,"approuve",e.organisateur,e.titre) }}
                            className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold hover:bg-green-200">✓</button>
                          <button onClick={ev => { ev.stopPropagation(); handleStatut(e.id,"refuse",e.organisateur,e.titre) }}
                            className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm font-bold hover:bg-red-200">✗</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top catégories */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Répartition par catégorie</h2>
                <div className="flex flex-col gap-3">
                  {catStats.map(({ cat, count }) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700 w-32 flex-shrink-0">{cat}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${catStats[0].count ? (count/catStats[0].count)*100 : 0}%`, background: "linear-gradient(90deg,#FF4D00,#FF8C42)" }} />
                      </div>
                      <span className="text-sm font-bold text-gray-500 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ ÉVÉNEMENTS ══ */}
          {section === "evenements" && (
            <div className="flex gap-6">
              <div className="flex-1">
                {/* Stats */}
                <div className="grid grid-cols-5 gap-3 mb-5">
                  {[
                    { label: "En attente", value: nbEnAttente, color: "text-amber-500", key: "en_attente" },
                    { label: "Approuvés", value: nbApprouves, color: "text-green-500", key: "approuve" },
                    { label: "Refusés", value: nbRefuses, color: "text-red-500", key: "refuse" },
                    { label: "Passés", value: nbPasse, color: "text-gray-400", key: "passe" },
                    { label: "Total", value: evenements.length, color: "text-orange-500", key: "tous" },
                  ].map(s => (
                    <div key={s.key} onClick={() => setFiltre(s.key)}
                      className={`bg-white rounded-2xl p-3 text-center cursor-pointer border transition-all hover:shadow-sm ${filtre===s.key?"border-orange-400":"border-gray-100"}`}>
                      <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-gray-400 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {nbEnAttente > 0 && (
                  <div className="flex gap-2 mb-4">
                    <button onClick={toutApprouver} disabled={moderationEnCours}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
                      style={{ background: "#22c55e" }}>
                      ✅ Tout approuver ({nbEnAttente})
                    </button>
                    <button onClick={moderationAuto} disabled={moderationEnCours}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
                      style={{ background: "#7C3AED" }}>
                      {moderationEnCours ? "⏳ En cours..." : `🤖 Auto (${nbEnAttente})`}
                    </button>
                  </div>
                )}

                {/* Search + filtres */}
                <input value={recherche} onChange={e => setRecherche(e.target.value)}
                  placeholder="🔍 Rechercher par titre, ville, organisateur..."
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none mb-3 focus:border-orange-400" />
                <div className="flex gap-2 mb-4 flex-wrap">
                  {[{key:"en_attente",label:"⏳ En attente"},{key:"approuve",label:"✅ Approuvés"},{key:"refuse",label:"❌ Refusés"},{key:"passe",label:"🕰️ Passés"},{key:"tous",label:"🗂️ Tous"}].map(s => (
                    <button key={s.key} onClick={() => setFiltre(s.key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${filtre===s.key?"text-white":"border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      style={filtre===s.key?{background:"#FF4D00"}:{}}>{s.label}</button>
                  ))}
                </div>

                {/* Liste */}
                {loading ? <div className="text-center py-12 text-gray-400">⏳ Chargement...</div>
                : evenementsFiltres.length === 0 ? <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">📭 Aucun événement</div>
                : (
                  <div className="flex flex-col gap-2">
                    {evenementsFiltres.map(e => (
                      <div key={e.id} onClick={() => { setSelected(e); setEditing(false); setShowBackup(false) }}
                        className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition-all ${selected?.id===e.id?"border-orange-400":"border-gray-100"} ${isPasse(e.quand)?"opacity-60":""}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                            {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover"/> : <div className={`${e.couleur} w-full h-full flex items-center justify-center text-2xl`}>{e.emoji}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{e.titre}</p>
                            <p className="text-gray-500 text-xs">{e.ville} · {formatDate(e.quand)}{e.heure?` à ${e.heure}`:""}</p>
                            <p className="text-gray-400 text-xs">Par {e.organisateur}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isPasse(e.quand)?"bg-gray-100 text-gray-400":e.statut==="approuve"?"bg-green-100 text-green-600":e.statut==="refuse"?"bg-red-100 text-red-500":"bg-amber-100 text-amber-600"}`}>
                              {isPasse(e.quand)?"Passé":e.statut==="en_attente"?"En attente":e.statut==="approuve"?"Approuvé":"Refusé"}
                            </span>
                            {e.backup && <span className="text-[10px] text-orange-400">💾 backup</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panneau détail */}
              {selected && (
                <div className="w-72 flex-shrink-0">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-gray-900 text-sm">{showBackup?"💾 Backup":editing?"✏️ Modifier":"Détail"}</h3>
                      <button onClick={() => { setSelected(null); setEditing(false); setShowBackup(false) }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
                    </div>

                    {showBackup && selected.backup && (
                      <div className="flex flex-col gap-3">
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700">
                          Backup du {new Date(selected.backup.saved_at).toLocaleDateString("fr-FR")}
                        </div>
                        {selected.backup.image_url && <img src={selected.backup.image_url} alt="backup" className="w-full h-28 object-cover rounded-xl"/>}
                        {[{l:"Titre",v:selected.backup.titre},{l:"Ville",v:selected.backup.ville},{l:"Prix",v:selected.backup.prix||"Gratuit"}].map(item => (
                          <div key={item.l} className="bg-gray-50 rounded-xl p-3 text-sm">
                            <p className="text-xs text-gray-400 mb-0.5">{item.l}</p>
                            <p className="text-gray-700 font-medium">{item.v}</p>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setShowBackup(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-full font-bold text-xs">← Retour</button>
                          <button onClick={handleRestore} className="flex-1 text-white py-2 rounded-full font-bold text-xs" style={{ background: "#FF4D00" }}>↩ Restaurer</button>
                        </div>
                      </div>
                    )}

                    {!editing && !showBackup && (
                      <>
                        <div className="rounded-xl overflow-hidden h-36 mb-4">
                          {selected.image_url ? <img src={selected.image_url} alt={selected.titre} className="w-full h-full object-cover"/> : <div className={`${selected.couleur} w-full h-full flex items-center justify-center text-5xl`}>{selected.emoji}</div>}
                        </div>
                        <p className="font-black text-gray-900 mb-1">{selected.titre}</p>
                        <div className="flex flex-col gap-1 mb-3 text-xs text-gray-500">
                          <span>📍 {selected.ville}</span>
                          <span>📅 {formatDate(selected.quand)}{selected.heure?` à ${selected.heure}`:""}</span>
                          <span>🏷️ {selected.categorie}</span>
                          <span className={selected.prix==="Gratuit"?"text-green-600 font-semibold":"font-semibold text-gray-800"}>💶 {selected.prix}</span>
                          <span>👤 {selected.organisateur}</span>
                        </div>
                        {selected.description && <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 mb-4 leading-relaxed">{selected.description}</p>}
                        <div className="flex flex-col gap-2">
                          {selected.statut!=="approuve"&&!isPasse(selected.quand)&&<button onClick={() => handleStatut(selected.id,"approuve",selected.organisateur,selected.titre)} className="w-full text-white py-2 rounded-full font-bold text-xs" style={{ background: "#22c55e" }}>✓ Approuver</button>}
                          {selected.statut!=="refuse"&&!isPasse(selected.quand)&&<button onClick={() => handleStatut(selected.id,"refuse",selected.organisateur,selected.titre)} className="w-full text-white py-2 rounded-full font-bold text-xs" style={{ background: "#f59e0b" }}>✗ Refuser</button>}
                          {selected.statut==="refuse"&&<button onClick={() => handleStatut(selected.id,"approuve",selected.organisateur,selected.titre)} className="w-full text-white py-2 rounded-full font-bold text-xs" style={{ background: "#22c55e" }}>↩ Réapprouver</button>}
                          {selected.backup&&<button onClick={() => setShowBackup(true)} className="w-full border border-orange-300 text-orange-600 py-2 rounded-full font-bold text-xs hover:bg-orange-50">💾 Backup</button>}
                          <button onClick={() => { setEditing(true); setEditForm({ titre:selected.titre, categorie:selected.categorie, ville:selected.ville, quand:selected.quand, heure:selected.heure, prix:selected.prix, description:selected.description, image_url:selected.image_url }) }} className="w-full border border-blue-200 text-blue-600 py-2 rounded-full font-bold text-xs hover:bg-blue-50">✏️ Modifier</button>
                          <button onClick={() => router.push(`/evenement/${selected.id}`)} className="w-full border border-gray-200 text-gray-600 py-2 rounded-full font-bold text-xs hover:bg-gray-50">👁️ Voir</button>
                          <button onClick={() => { setSpotlightIds(ids => ids.includes(selected.id) ? ids.filter(i=>i!==selected.id) : [...ids,selected.id].slice(0,3)) }} className={`w-full border py-2 rounded-full font-bold text-xs ${spotlightIds.includes(selected.id)?"border-orange-300 bg-orange-50 text-orange-600":"border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                            {spotlightIds.includes(selected.id)?"🔥 Retiré de la une":"🔥 Mettre à la une"}
                          </button>
                          <button onClick={() => handleDelete(selected.id)} className="w-full bg-red-500 text-white py-2 rounded-full font-bold text-xs hover:bg-red-600">🗑️ Supprimer</button>
                        </div>
                      </>
                    )}

                    {editing && !showBackup && (
                      <div className="flex flex-col gap-3">
                        {[{label:"Titre",key:"titre"},{label:"Ville",key:"ville"},{label:"Prix",key:"prix",placeholder:"Ex: 10€ ou Gratuit"}].map(field => (
                          <div key={field.key}>
                            <label className="text-xs text-gray-500 mb-1 block">{field.label}</label>
                            <input value={(editForm as any)[field.key]||""} onChange={e => setEditForm({...editForm,[field.key]:e.target.value})} placeholder={field.placeholder} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"/>
                          </div>
                        ))}
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
                          <select value={editForm.categorie||""} onChange={e => setEditForm({...editForm,categorie:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400">
                            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Date</label>
                            <input type="date" value={editForm.quand||""} onChange={e => setEditForm({...editForm,quand:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"/>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Heure</label>
                            <input type="time" value={editForm.heure||""} onChange={e => setEditForm({...editForm,heure:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"/>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Description</label>
                          <textarea value={editForm.description||""} onChange={e => setEditForm({...editForm,description:e.target.value})} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none"/>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Image (URL)</label>
                          {editForm.image_url ? (
                            <div className="relative">
                              <img src={editForm.image_url} alt="preview" className="w-full h-24 object-cover rounded-xl"/>
                              <button onClick={() => setEditForm({...editForm,image_url:""})} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                            </div>
                          ) : (
                            <label className="w-full h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 text-gray-400 text-xs gap-1">
                              📸 Upload
                              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                                const file = e.target.files?.[0]; if (!file) return
                                const { error } = await supabase.storage.from("evenements").upload(`${Date.now()}-${file.name}`,file)
                                if (!error) {
                                  const { data: urlData } = supabase.storage.from("evenements").getPublicUrl(`${Date.now()}-${file.name}`)
                                  setEditForm({...editForm,image_url:urlData.publicUrl})
                                }
                              }}/>
                            </label>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditing(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-full font-bold text-xs">Annuler</button>
                          <button onClick={handleSave} disabled={saving} className="flex-1 text-white py-2 rounded-full font-bold text-xs disabled:opacity-50" style={{ background: "#FF4D00" }}>{saving?"⏳":"💾 Sauver"}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PUBLICITÉS ══ */}
          {section === "pubs" && (
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-gray-500">{pubs.filter(p=>p.actif).length} active{pubs.filter(p=>p.actif).length>1?"s":""} sur {pubs.length}</p>
                  <button onClick={() => { setNewPub(true); setEditingPub(true); setSelectedPub(null); setPubForm({actif:true,rayon:50}) }}
                    className="px-4 py-2 rounded-full text-sm font-bold text-white"
                    style={{ background: "#FF4D00" }}>+ Nouvelle pub</button>
                </div>
                {pubs.length === 0 ? <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">📢 Aucune publicité</div>
                : (
                  <div className="flex flex-col gap-2">
                    {pubs.map(pub => (
                      <div key={pub.id} onClick={() => { setSelectedPub(pub); setEditingPub(false); setNewPub(false) }}
                        className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition-all ${selectedPub?.id===pub.id?"border-orange-400":"border-gray-100"}`}>
                        <div className="flex items-center gap-3">
                          {pub.image_url ? <img src={pub.image_url} alt={pub.nom_commerce} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/> : <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">📢</div>}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{pub.nom_commerce}</p>
                            <p className="text-gray-500 text-xs truncate">{pub.description}</p>
                            <p className="text-gray-400 text-xs">{pub.ville||"France"} · {pub.rayon||50} km</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); toggleActif(pub) }}
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${pub.actif?"bg-green-100 text-green-600":"bg-gray-100 text-gray-400"}`}>
                            {pub.actif?"✅ Active":"⏸ Off"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {(selectedPub||newPub) && (
                <div className="w-72 flex-shrink-0">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-gray-900 text-sm">{newPub?"➕ Nouvelle":editingPub?"✏️ Modifier":"Détail"}</h3>
                      <button onClick={() => { setSelectedPub(null); setEditingPub(false); setNewPub(false) }} className="text-gray-400 text-lg">✕</button>
                    </div>
                    {!editingPub && selectedPub && (
                      <>
                        {selectedPub.image_url && <img src={selectedPub.image_url} alt={selectedPub.nom_commerce} className="w-full h-32 object-cover rounded-xl mb-3"/>}
                        <p className="font-black text-gray-900 mb-1">{selectedPub.nom_commerce}</p>
                        <p className="text-sm text-gray-500 mb-3">{selectedPub.description}</p>
                        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs flex flex-col gap-1">
                          <span className="text-gray-500">Ville : <span className="text-gray-800 font-medium">{selectedPub.ville||"France"}</span></span>
                          <span className="text-gray-500">Rayon : <span className="text-gray-800 font-medium">{selectedPub.rayon||50} km</span></span>
                          {selectedPub.lien && <a href={selectedPub.lien} target="_blank" className="text-orange-500 font-medium hover:underline truncate">{selectedPub.lien}</a>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => toggleActif(selectedPub)} className={`w-full py-2 rounded-full font-bold text-xs ${selectedPub.actif?"bg-gray-100 text-gray-600":"text-white"}`} style={!selectedPub.actif?{background:"#22c55e"}:{}}>{selectedPub.actif?"⏸ Désactiver":"✅ Activer"}</button>
                          <button onClick={() => { setEditingPub(true); setPubForm({...selectedPub}) }} className="w-full border border-blue-200 text-blue-600 py-2 rounded-full font-bold text-xs">✏️ Modifier</button>
                          <button onClick={() => deletePub(selectedPub.id)} className="w-full bg-red-500 text-white py-2 rounded-full font-bold text-xs">🗑️ Supprimer</button>
                        </div>
                      </>
                    )}
                    {editingPub && (
                      <div className="flex flex-col gap-3">
                        {[{l:"Nom commerce",k:"nom_commerce",p:"Ex: Boulangerie Martin"},{l:"Description",k:"description",p:"Slogan / accroche"},{l:"Lien (URL)",k:"lien",p:"https://"},{l:"Image (URL)",k:"image_url",p:"https://"},{l:"Ville",k:"ville",p:"Lyon"}].map(f => (
                          <div key={f.k}>
                            <label className="text-xs text-gray-500 mb-1 block">{f.l}</label>
                            <input value={(pubForm as any)[f.k]||""} onChange={e => setPubForm({...pubForm,[f.k]:e.target.value})} placeholder={f.p} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"/>
                          </div>
                        ))}
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Rayon (km)</label>
                          <input type="number" value={pubForm.rayon||50} onChange={e => setPubForm({...pubForm,rayon:Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"/>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="actif" checked={pubForm.actif??true} onChange={e => setPubForm({...pubForm,actif:e.target.checked})} className="w-4 h-4"/>
                          <label htmlFor="actif" className="text-sm text-gray-700">Active</label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingPub(false); setNewPub(false) }} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-full font-bold text-xs">Annuler</button>
                          <button onClick={savePub} disabled={savingPub||!pubForm.nom_commerce} className="flex-1 text-white py-2 rounded-full font-bold text-xs disabled:opacity-50" style={{ background: "#FF4D00" }}>{savingPub?"⏳":"💾"}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ UTILISATEURS ══ */}
          {section === "utilisateurs" && (
            <div className="flex flex-col gap-4 max-w-2xl">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="font-black text-2xl text-orange-500">{users.length}</p>
                  <p className="text-xs text-gray-400">Utilisateurs actifs</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="font-black text-2xl text-purple-500">{totalFavoris}</p>
                  <p className="text-xs text-gray-400">Total favoris</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="font-black text-2xl text-blue-500">{users.length > 0 ? Math.round(totalFavoris/users.length) : 0}</p>
                  <p className="text-xs text-gray-400">Moy. favoris/user</p>
                </div>
              </div>
              {loadingUsers ? <div className="text-center py-8 text-gray-400">⏳ Chargement...</div> : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-gray-900 text-sm">Utilisateurs par favoris</p>
                    <p className="text-xs text-gray-400">{users.length} comptes</p>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                    {users.sort((a,b) => b.favoris-a.favoris).map((u,i) => (
                      <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: `hsl(${i*37%360},60%,55%)` }}>
                          {i+1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-500 truncate">{u.id}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-orange-500">
                          <span>❤️</span> {u.favoris}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {section === "analytics" && (
            <div className="flex flex-col gap-5 max-w-3xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Événements actifs", value: nbApprouves, icon: "✅", color: "text-green-500" },
                  { label: "En attente", value: nbEnAttente, icon: "⏳", color: "text-amber-500" },
                  { label: "Passés ce mois", value: nbPasse, icon: "🕰️", color: "text-gray-400" },
                  { label: "Pubs actives", value: pubs.filter(p=>p.actif).length, icon: "📢", color: "text-blue-500" },
                ].map((s,i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{s.icon}</span>
                      <span className={`font-black text-2xl ${s.color}`}>{s.value}</span>
                    </div>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Répartition catégories */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Événements par catégorie</h2>
                <div className="flex flex-col gap-3">
                  {ALL_CATEGORIES.map(cat => {
                    const count = evenements.filter(e => e.categorie===cat&&!isPasse(e.quand)).length
                    const max = Math.max(...ALL_CATEGORIES.map(c => evenements.filter(e => e.categorie===c&&!isPasse(e.quand)).length))
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-600 w-32 flex-shrink-0">{cat}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full" style={{ width:`${max?((count/max)*100):0}%`, background:"linear-gradient(90deg,#FF4D00,#FF8C42)" }}/>
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-5 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Villes top */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Top villes</h2>
                <div className="flex flex-col gap-2">
                  {Object.entries(evenements.filter(e=>!isPasse(e.quand)).reduce((acc,e) => { acc[e.ville]=(acc[e.ville]||0)+1; return acc },{}as Record<string,number>))
                    .sort((a,b) => b[1]-a[1]).slice(0,8).map(([ville,count],i) => (
                      <div key={ville} className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-400 w-5">{i+1}</span>
                        <span className="flex-1 text-sm font-semibold text-gray-700">{ville}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 rounded-full bg-orange-100" style={{ width: 60 }}>
                            <div className="h-2 rounded-full" style={{ width:`${(count as number/evenements.length)*100*3}%`, background:"#FF4D00" }}/>
                          </div>
                          <span className="text-xs font-bold text-orange-500">{count as number}</span>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ CATÉGORIES ══ */}
          {section === "categories" && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>Catégories actives</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ALL_CATEGORIES.length} catégories · gestion des événements par catégorie</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {ALL_CATEGORIES.map(cat => {
                    const count = evenements.filter(e => e.categorie===cat&&!isPasse(e.quand)).length
                    const total = evenements.filter(e => e.categorie===cat).length
                    return (
                      <div key={cat} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
                          {{"Musique":"🎵","Sport":"🏃","Danse":"💃","Culture":"🎨","Atelier":"🛠️","Food":"🍕","Nature & Rando":"🌿","Animaux":"🐾","Brocante":"🏺","Bar & Nuit":"🍸","Loto":"🎰","Enfants":"🧒","Autre":"✨"}[cat]}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm">{cat}</p>
                          <p className="text-xs text-gray-400">{count} actif{count>1?"s":""} · {total} total</p>
                        </div>
                        <button onClick={() => { setSection("evenements"); setFiltre("approuve"); setRecherche(""); setCatFilter(cat) }}
                          className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors">
                          Voir →
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ PARAMÈTRES ══ */}
          {section === "parametres" && (
            <div className="max-w-2xl flex flex-col gap-5">
              {/* Slogans hero */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Slogans du carrousel</h2>
                <p className="text-xs text-gray-400 mb-4">Ces phrases s'affichent dans la bannière principale selon la catégorie</p>
                <div className="flex flex-col gap-3">
                  {Object.entries(slogans).map(([cat, slogan]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
                        <span style={{ fontSize: 14 }}>
                          {{"Musique":"🎵","Sport":"🏃","Nature & Rando":"🌿","Culture":"🎨","Food":"🍕","Danse":"💃","Bar & Nuit":"🍸","Atelier":"🛠️","Enfants":"🧒","Animaux":"🐾","Brocante":"🏺","Loto":"🎰"}[cat]}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">{cat.replace(" & Rando","")}</span>
                      </div>
                      <input
                        value={slogan}
                        onChange={e => setSlogans(s => ({...s,[cat]:e.target.value}))}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                      />
                    </div>
                  ))}
                </div>
                <button onClick={saveParams} disabled={savingParams}
                  className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
                  style={{ background: "#FF4D00" }}>
                  {savingParams ? "⏳ Sauvegarde..." : paramsSaved ? "✅ Sauvegardé !" : "💾 Sauvegarder les slogans"}
                </button>
              </div>

              {/* Modération auto */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Modération automatique</h2>
                <p className="text-xs text-gray-400 mb-4">Mots clés détectés comme spam lors de la modération auto</p>
                <div className="flex flex-wrap gap-2">
                  {["spam","arnaque","promo","soldes","publicité","achetez","cliquez"].map(mot => (
                    <span key={mot} className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-500 border border-red-200">{mot}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">+ Titre {"<"} 5 caractères · Description {"<"} 10 caractères → refusé automatiquement</p>
              </div>

              {/* Infos site */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Infos du site</h2>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Prix publication", value: "9,90€ / événement (Stripe)" },
                    { label: "Email admin", value: ADMIN_EMAIL },
                    { label: "Rappel email", value: "J-1 avant l'événement" },
                    { label: "Statuts events", value: "en_attente → approuve / refuse" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ RAPPELS ══ */}
          {section === "rappels" && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>Rappels email programmés</p>
                    <p className="text-xs text-gray-400 mt-0.5">{rappels.length} rappel{rappels.length>1?"s":""} enregistré{rappels.length>1?"s":""}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${rappels.filter(r=>r.envoye).length > 0 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {rappels.filter(r=>r.envoye).length} envoyé{rappels.filter(r=>r.envoye).length>1?"s":""}
                  </span>
                </div>
                {rappels.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">🔔 Aucun rappel enregistré</div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                    {rappels.map(r => (
                      <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${r.envoye?"bg-green-100":"bg-orange-100"}`}>
                          {r.envoye ? "✅" : "🔔"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{r.email}</p>
                          <p className="text-xs text-gray-400">{r.quand} · {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.envoye?"bg-green-100 text-green-600":"bg-orange-100 text-orange-600"}`}>
                          {r.envoye ? "Envoyé" : "En attente"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ À LA UNE ══ */}
          {section === "alaune" && (
            <div className="max-w-2xl flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Section "À ne pas manquer"</h2>
                <p className="text-xs text-gray-400 mb-4">Sélectionne jusqu'à 3 événements à mettre en avant sur la page d'accueil</p>
                <div className="flex flex-col gap-2">
                  {evenements.filter(e => e.statut==="approuve"&&!isPasse(e.quand)).slice(0,15).map(e => (
                    <div key={e.id}
                      onClick={() => setSpotlightIds(ids => ids.includes(e.id) ? ids.filter(i=>i!==e.id) : ids.length < 3 ? [...ids,e.id] : ids)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${spotlightIds.includes(e.id)?"border-orange-400 bg-orange-50":"border-gray-100 hover:border-gray-200"}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${spotlightIds.includes(e.id)?"border-orange-500 bg-orange-500":"border-gray-300"}`}>
                        {spotlightIds.includes(e.id) && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                        {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover"/> : <div className={`${e.couleur} w-full h-full flex items-center justify-center text-lg`}>{e.emoji}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{e.titre}</p>
                        <p className="text-xs text-gray-400">{e.ville} · {formatDate(e.quand)}</p>
                      </div>
                      {spotlightIds.includes(e.id) && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 flex-shrink-0">
                          🔥 {spotlightIds.indexOf(e.id)+1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {spotlightIds.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-orange-700">{spotlightIds.length} événement{spotlightIds.length>1?"s":""} sélectionné{spotlightIds.length>1?"s":""}</p>
                  <button className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: "#FF4D00" }}
                    onClick={() => alert("Sauvegarde de la mise en avant — à connecter à une table Supabase 'spotlight'")}>
                    💾 Sauvegarder
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// Helper pour filtre catégorie depuis analytics
function setCatFilter(cat: string) {}
