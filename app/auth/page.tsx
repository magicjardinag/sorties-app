"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Auth() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleAuth = async () => {
    setLoading(true)
    setMessage("")

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage("Compte créé ! Vérifie ton email pour confirmer.")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push("/")
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600">SortiesApp</h1>
          <p className="text-gray-500 mt-1">Trouve des activités près de chez toi</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex mb-6 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === "login" ? "bg-white text-purple-600 shadow" : "text-gray-500"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-white text-purple-600 shadow" : "text-gray-500"
              }`}
            >
              Inscription
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-purple-400"
              />
            </div>

            {message && (
              <p className={`text-sm px-4 py-3 rounded-lg ${
                message.includes("créé") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}>
                {message}
              </p>
            )}

            <button
              onClick={handleAuth}
              disabled={loading || !email || !password}
              className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors disabled:opacity-40"
            >
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <button onClick={() => router.push("/")} className="text-purple-600 hover:underline">
            ← Retour à l'accueil
          </button>
        </p>
      </div>
    </main>
  )
}
