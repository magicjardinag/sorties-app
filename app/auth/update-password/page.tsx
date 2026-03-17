"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function UpdatePassword() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpdate = async () => {
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Mot de passe mis à jour !")
      setTimeout(() => router.push("/"), 2000)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600">SortiesApp</h1>
          <p className="text-gray-500 mt-1">Réinitialisation du mot de passe</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Nouveau mot de passe</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-purple-400"
              />
            </div>

            {message && (
              <p className={`text-sm px-4 py-3 rounded-lg ${
                message.includes("mis à jour") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}>
                {message}
              </p>
            )}

            <button
              onClick={handleUpdate}
              disabled={loading || !password || !confirm}
              className="w-full bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-700 transition-colors disabled:opacity-40"
            >
              {loading ? "Chargement..." : "Mettre à jour"}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
