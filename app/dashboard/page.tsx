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
  prix: string
  emoji: string
  statut: string
  image_url: string
}

type Stats = {
  vues: number
  participations: number
  favoris: number
}

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

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-1">
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span className="font-black text-2xl mt-1" style={{ color, fontFamily: "'Syne', sans-serif" }}>{value}</span>
      <span className="text-xs text-gray-400 font-medium mt-0.5 text-center">{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [stats, setStats] = useState<Record<number, Stats>>({})
  const [totalStats, setTotalStats] = useState({ vues: 0, participations: 0, favoris: 0 })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [section, setSection] = useState<"evenements" | "stats" | "favoris">("evenements")

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }
      setUser(user)

      const { data: evs } = await supabase
        .from("evenements")
        .select("*")
        .eq("user_id", user.id)
        .order("quand", { ascending: true })

      const evList = evs || []
      setEvenements(evList)

      // Charger les stats pour chaque événement
      const statsMap: Record<number, Stats> = {}
      let totalV = 0, totalP = 0, totalF = 0

      for (const ev of evList) {
        const [vuesRes, partRes, favRes] = await Promise.all([
          supabase.from("vues_evenements").select("id", { count: "exact" }).eq("evenement_id", ev.id),
          supabase.from("participations").select("id", { count: "exact" }).eq("evenement_id", ev.id),
          supabase.from("favoris").select("id", { count: "exact" }).eq("evenement_id", ev.id),
        ])
        const v = vuesRes.count || 0
        const p = partRes.count || 0
        const f = favRes.count || 0
        statsMap[ev.id] = { vues: v, participations: p, favoris: f }
        totalV += v; totalP += p; totalF += f
      }

      setStats(statsMap)
      setTotalStats({ vues: totalV, participations: totalP, favoris: totalF })
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet événement ?")) return
    await supabase.from("evenements").delete().eq("id", id)
    setEvenements(evenements.filter(e => e.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const tauxConcretisation = totalStats.vues > 0
    ? Math.round((totalStats.participations / totalStats.vues) * 100)
    : 0

  return (
    <main className="min-h-screen" style={{ background: "#F7F6F2", fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <h1 className="font-black text-lg text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Mon espace
          </h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/")} className="px-3 py-2 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
            ← Accueil
          </button>
          <button onClick={handleLogout} className="px-3 py-2 rounded-full text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50">
            Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

        {/* STATS GLOBALES */}
        {!loading && evenements.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-3 mb-3">
              <StatCard icon="👁️" label="Vues totales" value={totalStats.vues} color="#7C3AED" />
              <StatCard icon="🎉" label="Participations" value={totalStats.participations} color="#FF4D00" />
              <StatCard icon="❤️" label="Favoris" value={totalStats.favoris} color="#DB2777" />
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-1">
                <span style={{ fontSize: 22 }}>📈</span>
                <span className="font-black text-2xl mt-1" style={{ color: "#059669", fontFamily: "'Syne', sans-serif" }}>{tauxConcretisation}%</span>
                <span className="text-xs text-gray-400 font-medium mt-0.5 text-center">Taux concrét.</span>
              </div>
            </div>
            {totalStats.vues > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">Taux de concrétisation</span>
                  <span className="text-xs font-bold" style={{ color: "#059669" }}>{tauxConcretisation}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(tauxConcretisation, 100)}%`, background: "linear-gradient(90deg,#FF4D00,#FF8C42)" }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {totalStats.participations} personne{totalStats.participations > 1 ? "s" : ""} intéressée{totalStats.participations > 1 ? "s" : ""} sur {totalStats.vues} vue{totalStats.vues > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        )}

        {/* NAV */}
        <div className="flex gap-2 mb-5">
          {[
            { key: "evenements", label: "📅 Mes événements", count: evenements.length },
            { key: "stats", label: "📊 Statistiques" },
          ].map(s => (
            <button key={s.key} onClick={() => setSection(s.key as any)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all border"
              style={{
                background: section === s.key ? "#FF4D00" : "#fff",
                color: section === s.key ? "#fff" : "#555",
                borderColor: section === s.key ? "#FF4D00" : "#e5e5e5"
              }}>
              {s.label}{s.count !== undefined ? ` (${s.count})` : ""}
            </button>
          ))}
          <button onClick={() => router.push("/publier")}
            className="ml-auto px-4 py-2 rounded-full text-sm font-bold text-white flex-shrink-0"
            style={{ background: "#FF4D00" }}>
            + Publier
          </button>
        </div>

        {/* SECTION ÉVÉNEMENTS */}
        {section === "evenements" && (
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm">Chargement...</p>
              </div>
            ) : evenements.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-gray-500 mb-4 font-medium">Tu n'as pas encore publié d'événement</p>
                <button onClick={() => router.push("/publier")} className="px-6 py-3 rounded-full font-bold text-white" style={{ background: "#FF4D00" }}>
                  Publier mon premier événement
                </button>
              </div>
            ) : (
              evenements.map(e => {
                const s = stats[e.id] || { vues: 0, participations: 0, favoris: 0 }
                const taux = s.vues > 0 ? Math.round((s.participations / s.vues) * 100) : 0
                const isPasse = e.quand && new Date(e.quand) < new Date()
                return (
                  <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      {e.image_url ? (
                        <img src={e.image_url} alt={e.titre} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">{e.emoji}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{e.titre}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                            isPasse ? "bg-gray-100 text-gray-400" :
                            e.statut === "approuve" ? "bg-green-100 text-green-600" :
                            e.statut === "refuse" ? "bg-red-100 text-red-500" :
                            "bg-amber-100 text-amber-600"
                          }`}>
                            {isPasse ? "Passé" : e.statut === "approuve" ? "Publié" : e.statut === "refuse" ? "Refusé" : "En attente"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{e.ville} · <span style={{ color: "#FF4D00", fontWeight: 600 }}>{formatDate(e.quand)}</span> · {e.prix || "Gratuit"}</p>
                      </div>
                    </div>

                    {/* Mini stats par événement */}
                    <div className="border-t border-gray-50 px-4 py-3 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>👁️</span><span className="font-bold text-gray-800">{s.vues}</span> vues
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>🎉</span><span className="font-bold text-gray-800">{s.participations}</span> participations
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>❤️</span><span className="font-bold text-gray-800">{s.favoris}</span> favoris
                      </div>
                      {s.vues > 0 && (
                        <div className="ml-auto flex items-center gap-1 text-xs font-bold" style={{ color: "#059669" }}>
                          📈 {taux}%
                        </div>
                      )}
                    </div>

                    {/* Barre de progression taux */}
                    {s.vues > 0 && (
                      <div className="px-4 pb-3">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(taux, 100)}%`, background: "linear-gradient(90deg,#FF4D00,#FF8C42)" }} />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="border-t border-gray-50 px-4 py-2 flex gap-2">
                      <button onClick={() => router.push(`/evenement/${e.id}`)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                        👁️ Voir
                      </button>
                      <button onClick={() => handleDelete(e.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50">
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* SECTION STATS */}
        {section === "stats" && (
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Chargement...</div>
            ) : evenements.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <p className="text-4xl mb-3">📊</p>
                <p>Publie ton premier événement pour voir tes stats</p>
              </div>
            ) : (
              <>
                {/* Classement événements par vues */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h2 className="font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Classement par vues
                  </h2>
                  <div className="flex flex-col gap-3">
                    {evenements
                      .map(e => ({ ...e, ...(stats[e.id] || { vues: 0, participations: 0, favoris: 0 }) }))
                      .sort((a, b) => b.vues - a.vues)
                      .map((e, i) => (
                        <div key={e.id} className="flex items-center gap-3">
                          <span className="text-sm font-black text-gray-300 w-5">#{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{e.titre}</p>
                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-1.5 rounded-full" style={{
                                width: `${totalStats.vues > 0 ? (e.vues / Math.max(...evenements.map(ev => stats[ev.id]?.vues || 0))) * 100 : 0}%`,
                                background: "linear-gradient(90deg,#7C3AED,#9333EA)"
                              }} />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-700 flex-shrink-0">{e.vues} vues</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Taux de concrétisation par événement */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h2 className="font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Taux de concrétisation
                  </h2>
                  <div className="flex flex-col gap-3">
                    {evenements
                      .map(e => {
                        const s = stats[e.id] || { vues: 0, participations: 0, favoris: 0 }
                        const taux = s.vues > 0 ? Math.round((s.participations / s.vues) * 100) : 0
                        return { ...e, ...s, taux }
                      })
                      .sort((a, b) => b.taux - a.taux)
                      .map((e, i) => (
                        <div key={e.id} className="flex items-center gap-3">
                          <span className="text-sm font-black text-gray-300 w-5">#{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{e.titre}</p>
                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-1.5 rounded-full" style={{
                                width: `${e.taux}%`,
                                background: "linear-gradient(90deg,#FF4D00,#FF8C42)"
                              }} />
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className="text-sm font-bold" style={{ color: e.taux > 10 ? "#059669" : "#FF4D00" }}>{e.taux}%</span>
                            <p className="text-xs text-gray-400">{e.participations}/{e.vues}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Conseil */}
                {tauxConcretisation < 10 && totalStats.vues > 5 && (
                  <div className="rounded-2xl p-4 border" style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
                    <p className="text-sm font-bold text-orange-800 mb-1">💡 Conseil</p>
                    <p className="text-xs text-orange-700 leading-relaxed">
                      Ton taux de concrétisation est de {tauxConcretisation}%. Essaie d'améliorer la description de tes événements, d'ajouter une belle photo et de préciser le prix pour convertir plus de visiteurs en participants.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
