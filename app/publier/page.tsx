"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type VilleSuggestion = {
  nom: string
  codePostal: string
  lat: number
  lng: number
}

export default function Publier() {
  const router = useRouter()
  const [etape, setEtape] = useState(1)
  const [form, setForm] = useState({
    titre: "",
    categorie: "",
    ville: "",
    codePostal: "",
    lat: 0,
    lng: 0,
    date: "",
    heure: "",
    prix: "",
    description: "",
  })
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([])
  const [villeInput, setVilleInput] = useState("")
  const [villeValidee, setVilleValidee] = useState(false)

  const categories = ["Musique", "Sport", "Culture", "Food", "Nature", "Autre"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

const searchVille = async (query: string) => {
  setVilleInput(query)
  setVilleValidee(false)
  if (query.length < 2) {
    setSuggestions([])
    return
  }

  const isCodePostal = /^\d+$/.test(query)

  try {
    let results: VilleSuggestion[] = []

    if (isCodePostal) {
      const [byCP, byNom] = await Promise.all([
        fetch(`https://geo.api.gouv.fr/communes?codePostal=${query}&fields=nom,codesPostaux,centre&limit=5`).then(r => r.json()),
        fetch(`https://geo.api.gouv.fr/communes?nom=${query}&fields=nom,codesPostaux,centre&limit=5`).then(r => r.json()),
      ])
      const all = [...(Array.isArray(byCP) ? byCP : []), ...(Array.isArray(byNom) ? byNom : [])]
      results = all.map((item: any) => ({
        nom: item.nom,
        codePostal: item.codesPostaux?.[0] || "",
        lat: item.centre?.coordinates?.[1] || 0,
        lng: item.centre?.coordinates?.[0] || 0,
      }))
    } else {
      const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${query}&fields=nom,codesPostaux,centre&limit=5`)
      const data = await res.json()
      results = data.map((item: any) => ({
        nom: item.nom,
        codePostal: item.codesPostaux?.[0] || "",
        lat: item.centre?.coordinates?.[1] || 0,
        lng: item.centre?.coordinates?.[0] || 0,
      }))
    }

    setSuggestions(results)
  } catch (err) {
    console.error(err)
  }
}

  const selectVille = (suggestion: VilleSuggestion) => {
    setVilleInput(`${suggestion.nom} (${suggestion.codePostal})`)
    setForm({
      ...form,
      ville: suggestion.nom,
      codePostal: suggestion.codePostal,
      lat: suggestion.lat,
      lng: suggestion.lng,
    })
    setSuggestions([])
    setVilleValidee(true)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-purple-600 hover:text-purple-800 font-medium text-sm">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Publier un événement</h2>
        <p className="text-gray-500 mb-8">Remplis le formulaire pour publier ton événement</p>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${etape >= n ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                {n}
              </div>
              {n < 3 && <div className={`h-1 w-16 rounded ${etape > n ? "bg-purple-600" : "bg-gray-200"}`}/>}
            </div>
          ))}
          <span className="text-sm text-gray-500 ml-2">
            {etape === 1 ? "Infos générales" : etape === 2 ? "Détails" : "Confirmation"}
          </span>
        </div>

        {etape === 1 && (
          <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Titre de l'événement</label>
              <input name="titre" value={form.titre} onChange={handleChange} placeholder="Ex: Concert Jazz au Parc" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400"/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Catégorie</label>
              <select name="categorie" value={form.categorie} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400">
                <option value="">Choisir une catégorie</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ville</label>
              <input
                value={villeInput}
                onChange={(e) => searchVille(e.target.value)}
                placeholder="Ex: Paris, Lyon, Bordeaux..."
                className={`w-full border rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400 ${villeValidee ? "border-green-400 bg-green-50" : "border-gray-200"}`}
              />
              {villeValidee && (
                <span className="absolute right-3 top-10 text-green-500 text-lg">✓</span>
              )}
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => selectVille(s)}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium text-gray-800">{s.nom}</span>
                      <span className="text-gray-400 ml-2">{s.codePostal}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setEtape(2)} disabled={!form.titre || !form.categorie || !villeValidee} className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Suivant →
            </button>
          </div>
        )}

        {etape === 2 && (
          <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                <input name="date" type="date" value={form.date} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400"/>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Heure</label>
                <input name="heure" type="time" value={form.heure} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400"/>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Prix (laisser vide si gratuit)</label>
              <input name="prix" value={form.prix} onChange={handleChange} placeholder="Ex: 10€" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400"/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Décris ton événement..." rows={4} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400 resize-none"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEtape(1)} className="w-full border border-gray-200 text-gray-600 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors">← Retour</button>
              <button onClick={() => setEtape(3)} disabled={!form.date || !form.heure} className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">Récapitulatif</h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Titre</span><span className="font-medium text-gray-800">{form.titre}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Catégorie</span><span className="font-medium text-gray-800">{form.categorie}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Ville</span><span className="font-medium text-gray-800">{form.ville} ({form.codePostal})</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Date</span><span className="font-medium text-gray-800">{form.date} à {form.heure}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Prix</span><span className="font-medium text-gray-800">{form.prix || "Gratuit"}</span></div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-700">
              💳 La publication coûte <strong>9,90€</strong> — paiement sécurisé via Stripe
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEtape(2)} className="w-full border border-gray-200 text-gray-600 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors">← Modifier</button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(form)
                    })
                    const { url } = await res.json()
                    window.location.href = url
                  } catch (err) {
                    console.error(err)
                  }
                }}
                className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors"
              >
                Payer 9,90€ →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}