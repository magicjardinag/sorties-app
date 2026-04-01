"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Installer() {
  const router = useRouter()
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [alreadyInstalled, setAlreadyInstalled] = useState(false)

  useEffect(() => {
    // Détecter si déjà installé
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setAlreadyInstalled(true)
      return
    }

    // Détecter iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // Détecter Android
    const android = /android/i.test(navigator.userAgent)
    setIsAndroid(android)

    // Intercepter le prompt d'installation
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setInstalled(true))
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") setInstalled(true)
  }

  if (alreadyInstalled || installed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#F7F6F2" }}>
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="font-black text-2xl text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
          C'est installé !
        </h1>
        <p className="text-gray-500 mb-8">SortiesApp est sur ton écran d'accueil. Profites-en !</p>
        <button onClick={() => router.push("/")}
          className="px-8 py-4 rounded-full font-bold text-white text-lg"
          style={{ background: "#FF4D00" }}>
          Ouvrir SortiesApp →
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#F7F6F2" }}>

      {/* Logo */}
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
        style={{ background: "#FF4D00" }}>
        <span className="text-white font-black text-5xl" style={{ fontFamily: "'Syne', sans-serif" }}>S</span>
      </div>

      <h1 className="font-black text-3xl text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
        Installer SortiesApp
      </h1>
      <p className="text-gray-500 mb-8 max-w-xs">
        Ajoute SortiesApp sur ton écran d'accueil pour un accès rapide aux événements près de chez toi
      </p>

      {/* Bouton installation automatique Android/Chrome */}
      {installPrompt && (
        <button onClick={handleInstall}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-white text-lg mb-4 shadow-lg active:scale-95 transition-all"
          style={{ background: "#FF4D00", boxShadow: "0 8px 24px rgba(255,77,0,0.4)" }}>
          📲 Installer maintenant
        </button>
      )}

      {/* Instructions iOS */}
      {isIOS && !installPrompt && (
        <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left">
          <p className="font-bold text-gray-900 mb-3 text-center">Sur iPhone / iPad :</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Appuie sur <strong>⬆️ Partager</strong> en bas de Safari</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Choisis <strong>"Sur l'écran d'accueil"</strong></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Appuie sur <strong>"Ajouter"</strong> en haut à droite</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Android sans prompt */}
      {isAndroid && !installPrompt && (
        <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left">
          <p className="font-bold text-gray-900 mb-3 text-center">Sur Android :</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Appuie sur <strong>⋮</strong> en haut à droite de Chrome</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Choisis <strong>"Ajouter à l'écran d'accueil"</strong></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Appuie sur <strong>"Ajouter"</strong></p>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => router.push("/")}
        className="mt-6 text-sm text-gray-400 underline">
        Continuer sans installer
      </button>
    </main>
  )
}