"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const sujets = [
  { value: "question", label: "❓ Question générale" },
  { value: "annulation", label: "❌ Annulation d'un événement" },
  { value: "remboursement", label: "💶 Demande de remboursement" },
  { value: "signalement", label: "🚨 Signaler un événement" },
  { value: "partenariat", label: "🤝 Partenariat / Publicité" },
  { value: "technique", label: "🔧 Problème technique" },
  { value: "autre", label: "💬 Autre" },
]

export default function Contact() {
  const router = useRouter()
  const [form, setForm] = useState({
    nom: "",
    email: "",
    sujet: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError("Une erreur est survenue. Réessaie plus tard.")
      }
    } catch (err) {
      setError("Une erreur est survenue. Réessaie plus tard.")
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center gap-4">
        <button onClick={() => router.push("/")} className="text-purple-600 hover:text-purple-800 font-medium text-sm">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {sent ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Message envoyé !</h2>
            <p className="text-gray-500 mb-6">Nous avons bien reçu ta demande et nous te répondrons dans les plus brefs délais.</p>
            <button onClick={() => router.push("/")} className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors">
              Retour à l'accueil
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Nous contacter</h2>
            <p className="text-gray-500 mb-8">Une question, un problème ou une demande ? On est là pour t'aider !</p>

            {/* Infos rapides */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <p className="text-2xl mb-2">⚡</p>
                <p className="text-sm font-medium text-gray-800">Réponse rapide</p>
                <p className="text-xs text-gray-500">Sous 24h</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <p className="text-2xl mb-2">🔒</p>
                <p className="text-sm font-medium text-gray-800">Confidentiel</p>
                <p className="text-xs text-gray-500">Données protégées</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm font-medium text-gray-800">Support humain</p>
                <p className="text-xs text-gray-500">Pas de bot</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nom</label>
                  <input name="nom" value={form.nom} onChange={handleChange} placeholder="Ton nom" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400"/>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="ton@email.com" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400"/>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Sujet</label>
                <select name="sujet" value={form.sujet} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400">
                  <option value="">Choisir un sujet</option>
                  {sujets.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Décris ta demande en détail..." rows={5} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-purple-400 resize-none"/>
              </div>

              {error && (
                <p className="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-600">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !form.nom || !form.email || !form.sujet || !form.message}
                className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Envoi en cours..." : "Envoyer le message →"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
