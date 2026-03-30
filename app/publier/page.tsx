"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type VilleSuggestion = {
  nom: string
  codePostal: string
  lat: number
  lng: number
}

// ── Dictionnaire de suggestions par mot-clé ──────────────────────────────
const SUGGESTIONS_KEYWORDS: Record<string, string[]> = {
  // Marchés
  "march": ["Marché nocturne", "Marché provençal", "Marché bio", "Marché artisanal", "Marché de Noël", "Marché aux puces", "Marché fermier", "Marché créateurs"],
  "marché": ["Marché nocturne", "Marché provençal", "Marché bio", "Marché artisanal", "Marché de Noël", "Marché aux puces", "Marché fermier"],
  // Concerts
  "conc": ["Concert acoustique", "Concert jazz", "Concert rock", "Concert classique", "Concert gratuit", "Concert en plein air", "Concert folk"],
  "concert": ["Concert acoustique", "Concert jazz", "Concert rock", "Concert classique", "Concert gratuit", "Concert en plein air"],
  // Festivals
  "fest": ["Festival de musique", "Festival de rue", "Festival gastronomique", "Festival culturel", "Festival folk", "Festival jazz", "Festival gratuit"],
  "festival": ["Festival de musique", "Festival de rue", "Festival gastronomique", "Festival culturel", "Festival folk"],
  // Randonnées
  "rand": ["Randonnée pédestre", "Randonnée nocturne", "Randonnée en famille", "Randonnée VTT", "Randonnée découverte", "Rando + pique-nique"],
  "rando": ["Randonnée pédestre", "Randonnée nocturne", "Randonnée en famille", "Randonnée VTT", "Randonnée découverte"],
  // Soirées
  "soir": ["Soirée dansante", "Soirée jazz", "Soirée quiz", "Soirée déguisée", "Soirée karaoké", "Soirée jeux de société", "Soirée cinéma"],
  "soirée": ["Soirée dansante", "Soirée jazz", "Soirée quiz", "Soirée déguisée", "Soirée karaoké"],
  // Ateliers
  "ateli": ["Atelier peinture", "Atelier céramique", "Atelier cuisine", "Atelier yoga", "Atelier photo", "Atelier broderie", "Atelier poterie"],
  "atelier": ["Atelier peinture", "Atelier céramique", "Atelier cuisine", "Atelier yoga", "Atelier photo"],
  // Sports
  "tourn": ["Tournoi de foot", "Tournoi de pétanque", "Tournoi de tennis", "Tournoi de volley", "Tournoi inter-villages"],
  "tournoi": ["Tournoi de foot", "Tournoi de pétanque", "Tournoi de tennis", "Tournoi de volley"],
  "course": ["Course nature", "Course à pied", "Course cycliste", "Course en montagne", "Course caritative"],
  // Expos
  "expo": ["Exposition photo", "Exposition peinture", "Exposition sculptures", "Exposition artisanat", "Exposition temporaire"],
  "exposition": ["Exposition photo", "Exposition peinture", "Exposition sculptures", "Exposition artisanat"],
  // Brocante / vide-grenier
  "broc": ["Brocante villageoise", "Brocante et antiquités", "Brocante en plein air", "Grande brocante"],
  "vide": ["Vide-grenier", "Vide-grenier géant", "Vide-grenier familial", "Vide-dressing"],
  // Spectacles
  "spec": ["Spectacle de rue", "Spectacle de danse", "Spectacle enfants", "Spectacle humoristique", "Spectacle de magie"],
  "spectacle": ["Spectacle de rue", "Spectacle de danse", "Spectacle enfants", "Spectacle humoristique"],
  // Repas / food
  "repas": ["Repas dansant", "Repas associatif", "Repas de village", "Repas gastronomique"],
  "dîner": ["Dîner dansant", "Dîner spectacle", "Dîner associatif", "Dîner en blanc"],
  "diner": ["Dîner dansant", "Dîner spectacle", "Dîner associatif"],
  "food": ["Food truck", "Food festival", "Street food", "Food & music"],
  // Loto
  "loto": ["Loto du printemps", "Loto géant", "Loto caritatif", "Super loto", "Loto de l'association"],
  // Bal
  "bal": ["Bal populaire", "Bal folk", "Bal musette", "Bal de village", "Bal des pompiers"],
  // Yoga / bien-être
  "yoga": ["Yoga en plein air", "Yoga du matin", "Yoga et méditation", "Yoga pour débutants"],
  "meditat": ["Méditation guidée", "Méditation en plein air", "Méditation et yoga"],
  // Nature
  "nature": ["Balade nature", "Nature et patrimoine", "Nature en famille", "Nature & photographie"],
  "balade": ["Balade nature", "Balade nocturne", "Balade à vélo", "Balade historique", "Balade en famille"],
  // Enfants
  "enfant": ["Spectacle enfants", "Atelier enfants", "Sortie famille", "Animation enfants", "Chasse aux œufs"],
  "famil": ["Sortie en famille", "Fête familiale", "Week-end famille", "Journée famille"],
}

function getSuggestions(input: string): string[] {
  if (!input || input.length < 3) return []
  const lower = input.toLowerCase()
  const results = new Set<string>()
  for (const [key, suggestions] of Object.entries(SUGGESTIONS_KEYWORDS)) {
    if (lower.includes(key) || key.includes(lower)) {
      suggestions.forEach(s => {
        // Ne pas suggérer ce qui est déjà tapé
        if (!s.toLowerCase().startsWith(lower)) results.add(s)
      })
    }
  }
  return Array.from(results).slice(0, 6)
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
    image_url: "",
  })
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([])
  const [villeInput, setVilleInput] = useState("")
  const [villeValidee, setVilleValidee] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [analysingImage, setAnalysingImage] = useState(false)
  const [analysisMessage, setAnalysisMessage] = useState("")

  // ── Autocomplétion titre ──
  const [titreSuggestions, setTitreSuggestions] = useState<string[]>([])
  const [motsAppris, setMotsAppris] = useState<string[]>([])
  const titreRef = useRef<HTMLInputElement>(null)

  // Charger les mots appris depuis Supabase au démarrage
  useEffect(() => {
    const loadMotsAppris = async () => {
      const { data } = await supabase
        .from("mots_cles")
        .select("mot")
        .order("count", { ascending: false })
        .limit(100)
      if (data) setMotsAppris(data.map((d: any) => d.mot))
    }
    loadMotsAppris()
  }, [])

  const categories = [
    "Musique", "Sport", "Danse", "Culture", "Atelier", "Food",
    "Nature & Rando", "Animaux", "Brocante", "Bar & Nuit", "Loto", "Enfants", "Autre"
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (name === "titre") {
      setTitreSuggestions(getSuggestionsCompletes(value))
    }
  }

  // Suggestions combinées : dictionnaire local + mots appris de la BDD
  const getSuggestionsCompletes = (input: string): string[] => {
    if (!input || input.length < 3) return []
    const lower = input.toLowerCase()
    const fromDict = getSuggestions(input)
    const fromDB = motsAppris.filter(mot =>
      mot.toLowerCase().includes(lower) &&
      !mot.toLowerCase().startsWith(lower) &&
      !fromDict.includes(mot)
    ).slice(0, 3)
    return [...fromDict, ...fromDB].slice(0, 7)
  }

  const applySuggestion = (suggestion: string) => {
    setForm({ ...form, titre: suggestion })
    setTitreSuggestions([])
    titreRef.current?.focus()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    analyserAffiche(file)
  }

  const analyserAffiche = async (file: File) => {
    setAnalysingImage(true)
    setAnalysisMessage("🤖 Analyse de l'affiche en cours...")
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(",")[1])
        r.onerror = () => rej(new Error("Read failed"))
        r.readAsDataURL(file)
      })
      const response = await fetch("/api/analyser-affiche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64, media_type: file.type }),
      })
      const result = await response.json()
      if (result.success && result.data) {
        const data = result.data
        setForm((prev) => ({
          ...prev,
          titre: data.titre || prev.titre,
          categorie: data.categorie || prev.categorie,
          date: data.date || prev.date,
          heure: data.heure || prev.heure,
          prix: data.prix || prev.prix,
          description: data.description || prev.description,
        }))
        if (data.titre) setTitreSuggestions(getSuggestions(data.titre))
        if (data.ville) {
          const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${data.ville}&fields=nom,codesPostaux,centre&limit=1`)
          const communes = await res.json()
          if (communes.length > 0) {
            const c = communes[0]
            setVilleInput(`${c.nom} (${c.codesPostaux?.[0] || ""})`)
            setForm((prev) => ({ ...prev, ville: c.nom, codePostal: c.codesPostaux?.[0] || "", lat: c.centre?.coordinates?.[1] || 0, lng: c.centre?.coordinates?.[0] || 0 }))
            setVilleValidee(true)
          }
        }
        setAnalysisMessage("✅ Informations extraites automatiquement ! Vérifie et corrige si besoin.")
      } else {
        setAnalysisMessage("⚠️ Impossible d'extraire les infos. Remplis le formulaire manuellement.")
      }
    } catch (err) {
      console.error(err)
      setAnalysisMessage("⚠️ Erreur lors de l'analyse. Remplis le formulaire manuellement.")
    }
    setAnalysingImage(false)
  }

  const uploadImage = async () => {
    if (!imageFile) return ""
    setUploadingImage(true)
    const fileName = `${Date.now()}-${imageFile.name}`
    const { data, error } = await supabase.storage.from("evenements").upload(fileName, imageFile)
    if (error) { console.error(error); setUploadingImage(false); return "" }
    const { data: urlData } = supabase.storage.from("evenements").getPublicUrl(fileName)
    setUploadingImage(false)
    return urlData.publicUrl
  }

  const searchVille = async (query: string) => {
    setVilleInput(query)
    setVilleValidee(false)
    if (query.length < 2) { setSuggestions([]); return }
    const isCodePostal = /^\d+$/.test(query)
    try {
      let results: VilleSuggestion[] = []
      if (isCodePostal) {
        const [byCP, byNom] = await Promise.all([
          fetch(`https://geo.api.gouv.fr/communes?codePostal=${query}&fields=nom,codesPostaux,centre&limit=5`).then(r => r.json()),
          fetch(`https://geo.api.gouv.fr/communes?nom=${query}&fields=nom,codesPostaux,centre&limit=5`).then(r => r.json()),
        ])
        const all = [...(Array.isArray(byCP) ? byCP : []), ...(Array.isArray(byNom) ? byNom : [])]
        results = all.map((item: any) => ({ nom: item.nom, codePostal: item.codesPostaux?.[0] || "", lat: item.centre?.coordinates?.[1] || 0, lng: item.centre?.coordinates?.[0] || 0 }))
      } else {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${query}&fields=nom,codesPostaux,centre&limit=5`)
        const data = await res.json()
        results = data.map((item: any) => ({ nom: item.nom, codePostal: item.codesPostaux?.[0] || "", lat: item.centre?.coordinates?.[1] || 0, lng: item.centre?.coordinates?.[0] || 0 }))
      }
      setSuggestions(results)
    } catch (err) { console.error(err) }
  }

  const selectVille = (suggestion: VilleSuggestion) => {
    setVilleInput(`${suggestion.nom} (${suggestion.codePostal})`)
    setForm({ ...form, ville: suggestion.nom, codePostal: suggestion.codePostal, lat: suggestion.lat, lng: suggestion.lng })
    setSuggestions([])
    setVilleValidee(true)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-purple-600 hover:text-purple-800 font-medium text-sm">← Retour</button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Publier un événement</h2>
        <p className="text-gray-500 mb-8">Remplis le formulaire ou uploade ton affiche pour remplissage automatique ✨</p>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${etape >= n ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-400"}`}>{n}</div>
              {n < 3 && <div className={`h-1 w-16 rounded ${etape > n ? "bg-purple-600" : "bg-gray-200"}`}/>}
            </div>
          ))}
          <span className="text-sm text-gray-500 ml-2">
            {etape === 1 ? "Photo & Infos" : etape === 2 ? "Détails" : "Confirmation"}
          </span>
        </div>

        {etape === 1 && (
          <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">

            {/* Upload image */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                📸 Affiche de l'événement
                <span className="text-purple-600 ml-2 font-normal text-xs">— L'IA remplit le formulaire automatiquement !</span>
              </label>
              {imagePreview ? (
                <div className="relative mb-2">
                  <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-lg"/>
                  <button onClick={() => { setImagePreview(""); setImageFile(null); setAnalysisMessage("") }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600">✕</button>
                </div>
              ) : (
                <label className="w-full h-32 border-2 border-dashed border-purple-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                  <span className="text-2xl mb-1">🖼️</span>
                  <span className="text-sm text-gray-500">Uploade ton affiche pour remplissage auto</span>
                  <span className="text-xs text-gray-400">JPG, PNG — max 5MB</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                </label>
              )}
              {analysingImage && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm text-purple-700 flex items-center gap-2">
                  <span className="animate-spin">⏳</span> {analysisMessage}
                </div>
              )}
              {!analysingImage && analysisMessage && (
                <div className={`rounded-lg px-4 py-3 text-sm ${analysisMessage.includes("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                  {analysisMessage}
                </div>
              )}
            </div>

            {/* Titre avec autocomplétion */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Titre de l'événement
                <span className="text-gray-400 font-normal ml-2 text-xs">— des suggestions apparaissent en tapant</span>
              </label>
              <input
                ref={titreRef}
                name="titre"
                value={form.titre}
                onChange={handleChange}
                placeholder="Ex: Marché nocturne, Concert jazz..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400"
                autoComplete="off"
              />
              {/* Chips de suggestions */}
              {titreSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {titreSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-sm active:scale-95"
                      style={{ background: "#F5F3FF", color: "#6D28D9", borderColor: "#DDD6FE" }}
                    >
                      {s} ↵
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Catégorie</label>
              <select name="categorie" value={form.categorie} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400">
                <option value="">Choisir une catégorie</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Ville */}
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ville</label>
              <input
                value={villeInput}
                onChange={(e) => searchVille(e.target.value)}
                placeholder="Ex: Paris, Lyon, Bordeaux..."
                className={`w-full border rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400 ${villeValidee ? "border-green-400 bg-green-50" : "border-gray-200"}`}
              />
              {villeValidee && <span className="absolute right-3 top-10 text-green-500 text-lg">✓</span>}
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => selectVille(s)} className="w-full text-left px-4 py-3 hover:bg-purple-50 text-sm border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-800">{s.nom}</span>
                      <span className="text-gray-400 ml-2">{s.codePostal}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setEtape(2)} disabled={!form.titre || !form.categorie || !villeValidee || analysingImage} className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
              {imagePreview && <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-lg mb-4"/>}
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
                    const imageUrl = await uploadImage()

                    // Sauvegarder le titre dans la BDD des mots clés
                    if (form.titre.trim().length > 3) {
                      await supabase.rpc("upsert_mot_cle", { p_mot: form.titre.trim() })
                        .catch(() => {
                          // Fallback si la fonction RPC n'existe pas encore
                          supabase.from("mots_cles")
                            .upsert({ mot: form.titre.trim(), count: 1 }, { onConflict: "mot", ignoreDuplicates: false })
                            .then(({ error }) => {
                              if (!error) {
                                supabase.from("mots_cles")
                                  .update({ count: supabase.raw("count + 1") as any })
                                  .eq("mot", form.titre.trim())
                              }
                            })
                        })
                    }

                    const res = await fetch("/api/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...form, image_url: imageUrl })
                    })
                    const { url } = await res.json()
                    window.location.href = url
                  } catch (err) { console.error(err) }
                }}
                disabled={uploadingImage}
                className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors disabled:opacity-40"
              >
                {uploadingImage ? "Upload en cours..." : "Payer 9,90€ →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
