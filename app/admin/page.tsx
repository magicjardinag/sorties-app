"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAIL = "a.giraudon@astem.fr"

type Evenement = {
  id: string; titre: string; categorie: string; ville: string; quand: string
  heure: string; prix: string; emoji: string; couleur: string; organisateur: string
  statut: string; description: string; image_url: string; backup: any
}

type Pub = {
  id: string; nom_commerce: string; description: string; image_url: string
  lien: string; ville: string; actif: boolean; lat: number; lng: number; rayon: number
}

const ALL_CATEGORIES = ["Musique","Sport","Danse","Culture","Atelier","Food","Nature & Rando","Animaux","Brocante","Bar & Nuit","Loto","Enfants","Autre"]

const HERO_SLOGANS_DEFAULT: Record<string,string> = {
  "Musique":"Tes oreilles méritent mieux que Spotify.",
  "Sport":"Ton canapé survivra sans toi ce soir.",
  "Nature & Rando":"La nature existe aussi en vrai, paraît-il.",
  "Culture":"Sors, t'auras l'air cultivé au bureau lundi.",
  "Food":"Tu peux pas manger pareil chez toi. Promis.",
  "Danse":"Personne juge. Enfin presque.",
  "Bar & Nuit":"Un verre dehors, ça compte comme du social.",
  "Atelier":"Crée un truc. Même raté c'est sympa.",
  "Enfants":"Épuise-les dehors. Dors mieux ce soir.",
  "Animaux":"Ton chien a besoin de toi. (C'est lui qui le dit.)",
  "Brocante":"Achète des trucs dont t'as pas besoin. Avec style.",
  "Loto":"Ce soir c'est peut-être toi. (C'est pas toi.)",
}

function formatDate(d:string){if(!d)return"";const t=new Date();t.setHours(0,0,0,0);const e=new Date(d);e.setHours(0,0,0,0);const diff=Math.round((e.getTime()-t.getTime())/(864e5));if(diff<0)return"⚠️ Passé";if(diff===0)return"Aujourd'hui";if(diff===1)return"Demain";return new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
function isPasse(d:string){if(!d)return false;const t=new Date();t.setHours(0,0,0,0);return new Date(d)<t}

type Section = "dashboard"|"evenements"|"pubs"|"utilisateurs"|"analytics"|"parametres"|"rappels"

const NAV_ITEMS = [
  {key:"dashboard",icon:"📊",label:"Dashboard"},
  {key:"evenements",icon:"📅",label:"Événements"},
  {key:"pubs",icon:"📢",label:"Pubs"},
  {key:"utilisateurs",icon:"👥",label:"Utilisateurs"},
  {key:"analytics",icon:"📈",label:"Analytics"},
  {key:"parametres",icon:"⚙️",label:"Paramètres"},
]

export default function Admin() {
  const router = useRouter()
  const [section, setSection] = useState<Section>("dashboard")
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Événements
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState("en_attente")
  const [selected, setSelected] = useState<Evenement|null>(null)
  const [recherche, setRecherche] = useState("")
  const [moderationEnCours, setModerationEnCours] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Evenement>>({})
  const [saving, setSaving] = useState(false)

  // Pubs
  const [pubs, setPubs] = useState<Pub[]>([])
  const [selectedPub, setSelectedPub] = useState<Pub|null>(null)
  const [editingPub, setEditingPub] = useState(false)
  const [pubForm, setPubForm] = useState<Partial<Pub>>({})
  const [savingPub, setSavingPub] = useState(false)
  const [newPub, setNewPub] = useState(false)

  // Utilisateurs
  const [users, setUsers] = useState<any[]>([])
  const [rappels, setRappels] = useState<any[]>([])
  const [slogans, setSlogans] = useState<Record<string,string>>(HERO_SLOGANS_DEFAULT)
  const [savingParams, setSavingParams] = useState(false)
  const [paramsSaved, setParamsSaved] = useState(false)

  useEffect(() => {
    const check = async () => {
      const {data:{session}} = await supabase.auth.getSession()
      const user = session?.user
      if (!user||user.email!==ADMIN_EMAIL) {
        setCheckingAuth(false)
        router.replace("/")
        return
      }
      setIsAuthorized(true)
      setCheckingAuth(false)
      fetchEvenements()
      fetchPubs()
    }
    check()
  }, [])

  useEffect(() => {
    if (section==="utilisateurs"&&users.length===0) fetchUsers()
    if (section==="rappels"&&rappels.length===0) fetchRappels()
  }, [section])

  const fetchEvenements = async () => {
    const {data} = await supabase.from("evenements").select("*").order("quand",{ascending:true})
    setEvenements(data||[])
    setLoading(false)
  }
  const fetchPubs = async () => {
    const {data} = await supabase.from("publicites").select("*").order("nom_commerce",{ascending:true})
    setPubs(data||[])
  }
  const fetchUsers = async () => {
    const {data} = await supabase.from("favoris").select("user_id").limit(100)
    const ids = [...new Set((data||[]).map((f:any)=>f.user_id))]
    setUsers(ids.map(id=>({id,favoris:(data||[]).filter((f:any)=>f.user_id===id).length})))
  }
  const fetchRappels = async () => {
    const {data} = await supabase.from("rappels").select("*").order("created_at",{ascending:false}).limit(50)
    setRappels(data||[])
  }

  const handleStatut = async (id:string,statut:string,organisateur:string,titre:string) => {
    await fetch("/api/moderation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,statut,organisateur,titre})})
    await fetchEvenements()
    setSelected(null)
  }
  const handleDelete = async (id:string) => {
    if(!confirm("Supprimer ?")) return
    await supabase.from("evenements").delete().eq("id",id)
    setEvenements(evenements.filter(e=>e.id!==id))
    setSelected(null)
  }
  const handleSave = async () => {
    if(!selected) return
    setSaving(true)
    await supabase.from("evenements").update({titre:editForm.titre,categorie:editForm.categorie,ville:editForm.ville,quand:editForm.quand,heure:editForm.heure,prix:editForm.prix,description:editForm.description,image_url:editForm.image_url}).eq("id",selected.id)
    await fetchEvenements()
    setEditing(false); setSaving(false)
  }
  const toutApprouver = async () => {
    const en = evenements.filter(e=>e.statut==="en_attente")
    if(!confirm(`Approuver ${en.length} événements ?`)) return
    setModerationEnCours(true)
    for(const e of en) await handleStatut(e.id,"approuve",e.organisateur,e.titre)
    setModerationEnCours(false)
  }
  const savePub = async () => {
    setSavingPub(true)
    const p={nom_commerce:pubForm.nom_commerce,description:pubForm.description,image_url:pubForm.image_url||"",lien:pubForm.lien||"",ville:pubForm.ville||"",actif:pubForm.actif??true,lat:pubForm.lat||null,lng:pubForm.lng||null,rayon:pubForm.rayon||50}
    if(newPub) await supabase.from("publicites").insert(p)
    else if(selectedPub) await supabase.from("publicites").update(p).eq("id",selectedPub.id)
    await fetchPubs()
    setEditingPub(false); setNewPub(false); setSelectedPub(null); setSavingPub(false)
  }

  const evenementsFiltres = evenements.filter(e => {
    const passe = isPasse(e.quand)
    if(filtre==="passe") return passe
    if(filtre==="tous") return true
    return e.statut===filtre&&!passe
  }).filter(e =>
    e.titre.toLowerCase().includes(recherche.toLowerCase())||
    e.ville.toLowerCase().includes(recherche.toLowerCase())
  )

  const nbEnAttente = evenements.filter(e=>e.statut==="en_attente"&&!isPasse(e.quand)).length
  const nbApprouves = evenements.filter(e=>e.statut==="approuve"&&!isPasse(e.quand)).length
  const totalFavoris = users.reduce((a,u)=>a+u.favoris,0)

  const saveParams = async () => {
    setSavingParams(true)
    localStorage.setItem("admin_slogans",JSON.stringify(slogans))
    setTimeout(()=>{setSavingParams(false);setParamsSaved(true);setTimeout(()=>setParamsSaved(false),2000)},600)
  }

  if (checkingAuth||!isAuthorized) return null

  return (
    <div className="flex min-h-screen" style={{background:"#F7F6F2",fontFamily:"'DM Sans',sans-serif"}}>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen">
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black" style={{background:"#FF4D00"}}>S</div>
          <div>
            <p className="font-black text-gray-900 text-sm leading-none">SortiesApp</p>
            <p className="text-[10px] text-orange-500 font-semibold">Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(n => (
            <button key={n.key} onClick={()=>setSection(n.key as Section)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${section===n.key?"text-white":"text-gray-500 hover:bg-gray-100"}`}
              style={section===n.key?{background:"linear-gradient(135deg,#FF4D00,#FF8C42)"}:{}}>
              <span style={{fontSize:16}}>{n.icon}</span>
              <span>{n.label}</span>
              {n.key==="evenements"&&nbEnAttente>0&&<span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${section===n.key?"bg-white/30 text-white":"bg-orange-100 text-orange-600"}`}>{nbEnAttente}</span>}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={()=>router.push("/")} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100">
            ← Voir le site
          </button>
        </div>
      </aside>

      {/* ── MENU MOBILE DRAWER ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setSidebarOpen(false)}/>
          <div className="relative w-64 bg-white h-full flex flex-col shadow-2xl">
            <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black" style={{background:"#FF4D00"}}>S</div>
                <div>
                  <p className="font-black text-gray-900 text-sm">SortiesApp</p>
                  <p className="text-[10px] text-orange-500 font-semibold">Admin</p>
                </div>
              </div>
              <button onClick={()=>setSidebarOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map(n => (
                <button key={n.key} onClick={()=>{setSection(n.key as Section);setSidebarOpen(false)}}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left ${section===n.key?"text-white":"text-gray-500"}`}
                  style={section===n.key?{background:"linear-gradient(135deg,#FF4D00,#FF8C42)"}:{}}>
                  <span style={{fontSize:18}}>{n.icon}</span>
                  <span>{n.label}</span>
                  {n.key==="evenements"&&nbEnAttente>0&&<span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{nbEnAttente}</span>}
                </button>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-gray-100">
              <button onClick={()=>router.push("/")} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500">
                ← Voir le site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENU ── */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">

        {/* Header mobile */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-20 flex items-center justify-between">
          <button onClick={()=>setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-base">☰</button>
          <h1 className="font-black text-gray-900 text-base" style={{fontFamily:"'Syne',sans-serif"}}>
            {NAV_ITEMS.find(n=>n.key===section)?.icon} {NAV_ITEMS.find(n=>n.key===section)?.label}
          </h1>
          {nbEnAttente>0&&(
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-orange-600" style={{background:"#FFF7ED"}}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block"/>
              {nbEnAttente}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">

          {/* ══ DASHBOARD ══ */}
          {section==="dashboard" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:"En attente",value:nbEnAttente,color:"#f59e0b",icon:"⏳",onClick:()=>{setSection("evenements");setFiltre("en_attente")}},
                  {label:"Approuvés",value:nbApprouves,color:"#22c55e",icon:"✅",onClick:()=>{setSection("evenements");setFiltre("approuve")}},
                  {label:"Pubs actives",value:pubs.filter(p=>p.actif).length,color:"#3b82f6",icon:"📢",onClick:()=>setSection("pubs")},
                  {label:"Total events",value:evenements.length,color:"#FF4D00",icon:"📅",onClick:()=>{setSection("evenements");setFiltre("tous")}},
                ].map((s,i) => (
                  <button key={i} onClick={s.onClick} className="bg-white rounded-2xl p-4 border border-gray-100 text-left hover:shadow-sm transition-all active:scale-95">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-2xl font-black" style={{fontFamily:"'Syne',sans-serif",color:s.color}}>{s.value}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-400">{s.label}</p>
                  </button>
                ))}
              </div>

              {/* Actions rapides */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="font-black text-gray-900 mb-3 text-sm" style={{fontFamily:"'Syne',sans-serif"}}>Actions rapides</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {icon:"✅",label:`Tout approuver (${nbEnAttente})`,color:"#22c55e",bg:"#DCFCE7",onClick:toutApprouver,disabled:nbEnAttente===0},
                    {icon:"➕",label:"Nouvelle pub",color:"#FF4D00",bg:"#FEF3C7",onClick:()=>{setSection("pubs");setNewPub(true);setEditingPub(true);setPubForm({actif:true,rayon:50})},disabled:false},
                  ].map((a,i) => (
                    <button key={i} onClick={a.onClick} disabled={a.disabled}
                      className="flex items-center gap-2 p-3 rounded-xl text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
                      style={{background:a.bg,color:a.color}}>
                      <span style={{fontSize:18}}>{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* En attente */}
              {nbEnAttente>0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-black text-gray-900 text-sm" style={{fontFamily:"'Syne',sans-serif"}}>En attente</p>
                    <button onClick={()=>setSection("evenements")} className="text-xs font-bold" style={{color:"#FF4D00"}}>Voir tout →</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {evenements.filter(e=>e.statut==="en_attente"&&!isPasse(e.quand)).slice(0,5).map(e => (
                      <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer"
                        onClick={()=>{setSection("evenements");setSelected(e);setFiltre("en_attente")}}>
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-orange-50 flex items-center justify-center text-lg">
                          {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover"/> : e.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate">{e.titre}</p>
                          <p className="text-gray-400 text-xs">{e.ville} · {formatDate(e.quand)}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={ev=>{ev.stopPropagation();handleStatut(e.id,"approuve",e.organisateur,e.titre)}}
                            className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</button>
                          <button onClick={ev=>{ev.stopPropagation();handleStatut(e.id,"refuse",e.organisateur,e.titre)}}
                            className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm font-bold">✗</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ÉVÉNEMENTS ══ */}
          {section==="evenements" && (
            <div className="flex flex-col gap-4">
              {/* Stats */}
              <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
                {[
                  {key:"en_attente",label:"⏳ Attente",value:nbEnAttente,color:"text-amber-500"},
                  {key:"approuve",label:"✅ Approuvés",value:nbApprouves,color:"text-green-500"},
                  {key:"refuse",label:"❌ Refusés",value:evenements.filter(e=>e.statut==="refuse").length,color:"text-red-500"},
                  {key:"passe",label:"🕰️ Passés",value:evenements.filter(e=>isPasse(e.quand)).length,color:"text-gray-400"},
                  {key:"tous",label:"🗂️ Tous",value:evenements.length,color:"text-orange-500"},
                ].map(s => (
                  <button key={s.key} onClick={()=>setFiltre(s.key)}
                    className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${filtre===s.key?"border-orange-400 shadow-sm":"border-gray-100 bg-white"}`}>
                    <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                    <span className="text-gray-400">{s.label}</span>
                  </button>
                ))}
              </div>

              {nbEnAttente>0 && (
                <button onClick={toutApprouver} disabled={moderationEnCours}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                  style={{background:"#22c55e"}}>
                  {moderationEnCours?"⏳ En cours...":"✅ Tout approuver ("+nbEnAttente+")"}
                </button>
              )}

              <input value={recherche} onChange={e=>setRecherche(e.target.value)}
                placeholder="🔍 Rechercher..."
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-400"/>

              {loading ? <div className="text-center py-12 text-gray-400">⏳ Chargement...</div>
              : evenementsFiltres.length===0 ? <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">📭 Aucun événement</div>
              : evenementsFiltres.map(e => (
                <div key={e.id} onClick={()=>{setSelected(e);setEditing(false)}}
                  className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all ${selected?.id===e.id?"border-orange-400":"border-gray-100"} ${isPasse(e.quand)?"opacity-60":""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-orange-50 flex items-center justify-center text-2xl">
                      {e.image_url ? <img src={e.image_url} alt={e.titre} className="w-full h-full object-cover"/> : e.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{e.titre}</p>
                      <p className="text-gray-500 text-xs">{e.ville} · {formatDate(e.quand)}</p>
                      <p className="text-gray-400 text-xs">Par {e.organisateur}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${isPasse(e.quand)?"bg-gray-100 text-gray-400":e.statut==="approuve"?"bg-green-100 text-green-600":e.statut==="refuse"?"bg-red-100 text-red-500":"bg-amber-100 text-amber-600"}`}>
                      {isPasse(e.quand)?"Passé":e.statut==="en_attente"?"Attente":e.statut==="approuve"?"✅":"❌"}
                    </span>
                  </div>

                  {/* Détail inline sur mobile */}
                  {selected?.id===e.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {!editing ? (
                        <div className="flex flex-col gap-2">
                          {e.description && <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-3">{e.description}</p>}
                          <div className="grid grid-cols-2 gap-2">
                            {e.statut!=="approuve"&&!isPasse(e.quand)&&<button onClick={ev=>{ev.stopPropagation();handleStatut(e.id,"approuve",e.organisateur,e.titre)}} className="py-2 rounded-full font-bold text-xs text-white" style={{background:"#22c55e"}}>✓ Approuver</button>}
                            {e.statut!=="refuse"&&!isPasse(e.quand)&&<button onClick={ev=>{ev.stopPropagation();handleStatut(e.id,"refuse",e.organisateur,e.titre)}} className="py-2 rounded-full font-bold text-xs text-white" style={{background:"#f59e0b"}}>✗ Refuser</button>}
                            <button onClick={ev=>{ev.stopPropagation();setEditing(true);setEditForm({titre:e.titre,categorie:e.categorie,ville:e.ville,quand:e.quand,heure:e.heure,prix:e.prix,description:e.description,image_url:e.image_url})}} className="py-2 rounded-full font-bold text-xs border border-blue-200 text-blue-600">✏️ Modifier</button>
                            <button onClick={ev=>{ev.stopPropagation();router.push(`/evenement/${e.id}`)}} className="py-2 rounded-full font-bold text-xs border border-gray-200 text-gray-600">👁️ Voir</button>
                            <button onClick={ev=>{ev.stopPropagation();handleDelete(e.id)}} className="py-2 rounded-full font-bold text-xs bg-red-500 text-white col-span-2">🗑️ Supprimer</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3" onClick={ev=>ev.stopPropagation()}>
                          {[{label:"Titre",key:"titre"},{label:"Ville",key:"ville"},{label:"Prix",key:"prix"}].map(f => (
                            <div key={f.key}>
                              <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                              <input value={(editForm as any)[f.key]||""} onChange={e=>setEditForm({...editForm,[f.key]:e.target.value})}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"/>
                            </div>
                          ))}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
                            <select value={editForm.categorie||""} onChange={e=>setEditForm({...editForm,categorie:e.target.value})}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                              {ALL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Date</label>
                              <input type="date" value={editForm.quand||""} onChange={e=>setEditForm({...editForm,quand:e.target.value})}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"/>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Heure</label>
                              <input type="time" value={editForm.heure||""} onChange={e=>setEditForm({...editForm,heure:e.target.value})}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"/>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Description</label>
                            <textarea value={editForm.description||""} onChange={e=>setEditForm({...editForm,description:e.target.value})}
                              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none"/>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={()=>setEditing(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-full font-bold text-xs">Annuler</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 text-white py-2 rounded-full font-bold text-xs disabled:opacity-50" style={{background:"#FF4D00"}}>{saving?"⏳":"💾 Sauver"}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ══ PUBS ══ */}
          {section==="pubs" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{pubs.filter(p=>p.actif).length} active{pubs.filter(p=>p.actif).length>1?"s":""}</p>
                <button onClick={()=>{setNewPub(true);setEditingPub(true);setSelectedPub(null);setPubForm({actif:true,rayon:50})}}
                  className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{background:"#FF4D00"}}>+ Nouvelle</button>
              </div>
              {(newPub&&editingPub) && (
                <div className="bg-white rounded-2xl border border-orange-200 p-4">
                  <p className="font-black text-gray-900 text-sm mb-3">➕ Nouvelle publicité</p>
                  <div className="flex flex-col gap-3">
                    {[{l:"Nom commerce",k:"nom_commerce"},{l:"Description",k:"description"},{l:"Lien URL",k:"lien"},{l:"Image URL",k:"image_url"},{l:"Ville",k:"ville"}].map(f => (
                      <div key={f.k}>
                        <label className="text-xs text-gray-500 mb-1 block">{f.l}</label>
                        <input value={(pubForm as any)[f.k]||""} onChange={e=>setPubForm({...pubForm,[f.k]:e.target.value})}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"/>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button onClick={()=>{setNewPub(false);setEditingPub(false)}} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-full font-bold text-xs">Annuler</button>
                      <button onClick={savePub} disabled={savingPub||!pubForm.nom_commerce} className="flex-1 text-white py-2 rounded-full font-bold text-xs disabled:opacity-50" style={{background:"#FF4D00"}}>{savingPub?"⏳":"💾 Sauver"}</button>
                    </div>
                  </div>
                </div>
              )}
              {pubs.map(pub => (
                <div key={pub.id} className={`bg-white rounded-2xl border p-4 ${selectedPub?.id===pub.id?"border-orange-400":"border-gray-100"}`}>
                  <div className="flex items-center gap-3" onClick={()=>setSelectedPub(selectedPub?.id===pub.id?null:pub)}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-amber-50 flex items-center justify-center text-2xl">
                      {pub.image_url ? <img src={pub.image_url} alt={pub.nom_commerce} className="w-full h-full object-cover"/> : "📢"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{pub.nom_commerce}</p>
                      <p className="text-gray-500 text-xs truncate">{pub.description}</p>
                    </div>
                    <button onClick={e=>{e.stopPropagation();supabase.from("publicites").update({actif:!pub.actif}).eq("id",pub.id).then(()=>fetchPubs())}}
                      className={`text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${pub.actif?"bg-green-100 text-green-600":"bg-gray-100 text-gray-400"}`}>
                      {pub.actif?"✅ On":"⏸ Off"}
                    </button>
                  </div>
                  {selectedPub?.id===pub.id && !editingPub && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <button onClick={()=>{setEditingPub(true);setPubForm({...pub})}} className="flex-1 border border-blue-200 text-blue-600 py-2 rounded-full font-bold text-xs">✏️ Modifier</button>
                      <button onClick={()=>{if(confirm("Supprimer ?"))supabase.from("publicites").delete().eq("id",pub.id).then(()=>{fetchPubs();setSelectedPub(null)})}} className="flex-1 bg-red-500 text-white py-2 rounded-full font-bold text-xs">🗑️</button>
                    </div>
                  )}
                  {selectedPub?.id===pub.id && editingPub && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
                      {[{l:"Nom",k:"nom_commerce"},{l:"Description",k:"description"},{l:"Lien",k:"lien"},{l:"Ville",k:"ville"}].map(f => (
                        <div key={f.k}>
                          <label className="text-xs text-gray-500 mb-1 block">{f.l}</label>
                          <input value={(pubForm as any)[f.k]||""} onChange={e=>setPubForm({...pubForm,[f.k]:e.target.value})}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"/>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button onClick={()=>setEditingPub(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-full font-bold text-xs">Annuler</button>
                        <button onClick={savePub} disabled={savingPub} className="flex-1 text-white py-2 rounded-full font-bold text-xs" style={{background:"#FF4D00"}}>{savingPub?"⏳":"💾"}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ══ UTILISATEURS ══ */}
          {section==="utilisateurs" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[{label:"Utilisateurs",value:users.length,color:"#FF4D00"},{label:"Total favoris",value:totalFavoris,color:"#7C3AED"},{label:"Moy/user",value:users.length>0?Math.round(totalFavoris/users.length):0,color:"#3b82f6"}].map((s,i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
                    <p className="font-black text-xl" style={{color:s.color}}>{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-900 text-sm">{users.length} comptes actifs</p>
                </div>
                <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                  {users.sort((a,b)=>b.favoris-a.favoris).map((u,i) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{background:`hsl(${i*37%360},60%,55%)`}}>{i+1}</div>
                      <p className="text-xs font-mono text-gray-500 truncate flex-1">{u.id.slice(0,16)}...</p>
                      <span className="text-xs font-bold text-orange-500">❤️ {u.favoris}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {section==="analytics" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:"Actifs",value:nbApprouves,icon:"✅",color:"#22c55e"},
                  {label:"En attente",value:nbEnAttente,icon:"⏳",color:"#f59e0b"},
                  {label:"Passés",value:evenements.filter(e=>isPasse(e.quand)).length,icon:"🕰️",color:"#9ca3af"},
                  {label:"Pubs actives",value:pubs.filter(p=>p.actif).length,icon:"📢",color:"#3b82f6"},
                ].map((s,i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{s.icon}</span>
                      <span className="font-black text-2xl" style={{color:s.color}}>{s.value}</span>
                    </div>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="font-black text-gray-900 mb-3 text-sm" style={{fontFamily:"'Syne',sans-serif"}}>Par catégorie</p>
                <div className="flex flex-col gap-2.5">
                  {ALL_CATEGORIES.map(cat => {
                    const count = evenements.filter(e=>e.categorie===cat&&!isPasse(e.quand)).length
                    const max = Math.max(...ALL_CATEGORIES.map(c=>evenements.filter(e=>e.categorie===c&&!isPasse(e.quand)).length),1)
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-28 flex-shrink-0">{cat}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{width:`${(count/max)*100}%`,background:"linear-gradient(90deg,#FF4D00,#FF8C42)"}}/>
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-4 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ PARAMÈTRES ══ */}
          {section==="parametres" && (
            <div className="flex flex-col gap-4 max-w-lg">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="font-black text-gray-900 mb-1 text-sm" style={{fontFamily:"'Syne',sans-serif"}}>Slogans du carrousel</p>
                <p className="text-xs text-gray-400 mb-3">Phrases affichées dans la bannière principale</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(slogans).map(([cat,slogan]) => (
                    <div key={cat}>
                      <label className="text-xs text-gray-500 mb-0.5 block">{cat}</label>
                      <input value={slogan} onChange={e=>setSlogans(s=>({...s,[cat]:e.target.value}))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"/>
                    </div>
                  ))}
                </div>
                <button onClick={saveParams} disabled={savingParams}
                  className="mt-3 w-full py-2.5 rounded-full text-sm font-bold text-white disabled:opacity-50"
                  style={{background:"#FF4D00"}}>
                  {savingParams?"⏳":"paramsSaved?'✅ Sauvegardé !':'💾 Sauvegarder'"}
                </button>
              </div>
              <button onClick={()=>router.push("/")} className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 bg-white">
                ← Retour au site
              </button>
            </div>
          )}

        </div>
      </main>

      {/* ── NAV BAS MOBILE ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.slice(0,5).map(n => (
            <button key={n.key} onClick={()=>setSection(n.key as Section)}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 relative">
              <span style={{fontSize:20}}>{n.icon}</span>
              <span className={`text-[9px] font-bold ${section===n.key?"text-orange-500":"text-gray-400"}`}>{n.label}</span>
              {n.key==="evenements"&&nbEnAttente>0&&(
                <span className="absolute -top-0.5 right-0 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{nbEnAttente}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

    </div>
  )
}