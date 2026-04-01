"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Installer() {
  const router = useRouter()
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [alreadyInstalled, setAlreadyInstalled] = useState(false)
  const [systeme, setSysteme] = useState<"choix" | "android" | "iphone">("choix")

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setAlreadyInstalled(true)
      return
    }
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
    <main className="min-h-screen flex flex-col px-6 py-10" style={{ background: "#F7F6F2" }}>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-lg" style={{ background: "#FF4D00" }}>
          <span className="text-white font-black text-5xl" style={{ fontFamily: "'Syne', sans-serif" }}>S</span>
        </div>
        <h1 className="font-black text-2xl text-gray-900 text-center" style={{ fontFamily: "'Syne', sans-serif" }}>
          Installer SortiesApp
        </h1>
        <p className="text-gray-500 text-sm text-center mt-1">sur ton écran d'accueil</p>
      </div>

      {/* CHOIX DU SYSTÈME */}
      {systeme === "choix" && (
        <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
          <p className="text-center text-sm font-semibold text-gray-600 mb-2">
            Quel téléphone utilises-tu ?
          </p>

          <button onClick={() => setSysteme("android")}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
              <span style={{ fontSize: 32 }}>🤖</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">Android</p>
              <p className="text-xs text-gray-400 mt-0.5">Samsung, Huawei, Pixel, Xiaomi...</p>
            </div>
            <span className="ml-auto text-gray-300 text-xl">›</span>
          </button>

          <button onClick={() => setSysteme("iphone")}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#F3F4F6" }}>
              <span style={{ fontSize: 32 }}>🍎</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">iPhone</p>
              <p className="text-xs text-gray-400 mt-0.5">iPhone, iPad...</p>
            </div>
            <span className="ml-auto text-gray-300 text-xl">›</span>
          </button>

          <button onClick={() => router.push("/")} className="text-sm text-gray-400 underline text-center mt-2">
            Continuer sans installer
          </button>
        </div>
      )}

      {/* INSTRUCTIONS ANDROID */}
      {systeme === "android" && (
        <div className="flex flex-col max-w-sm mx-auto w-full">
          <button onClick={() => setSysteme("choix")} className="flex items-center gap-1 text-sm text-gray-400 mb-6">
            ← Retour
          </button>

          <p className="text-center font-bold text-gray-900 mb-6">Sur Android</p>

          {/* Si le prompt est disponible → bouton direct */}
          {installPrompt ? (
            <div className="flex flex-col gap-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-sm text-green-700 font-semibold mb-1">✅ Ton téléphone est compatible !</p>
                <p className="text-xs text-green-600">Appuie sur le bouton ci-dessous pour installer directement</p>
              </div>
              <button onClick={handleInstall}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg active:scale-95 transition-all"
                style={{ background: "#FF4D00", boxShadow: "0 8px 24px rgba(255,77,0,0.4)" }}>
                📲 Installer SortiesApp
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { n: 1, icon: "🌐", texte: "Ouvre ce site dans", gras: "Google Chrome" },
                { n: 2, icon: "⋮", texte: "Appuie sur les", gras: "3 points en haut à droite" },
                { n: 3, icon: "➕", texte: "Choisis", gras: '"Ajouter à l\'écran d\'accueil"' },
                { n: 4, icon: "✅", texte: "Appuie sur", gras: '"Ajouter"' },
              ].map(step => (
                <div key={step.n} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0 text-sm"
                    style={{ background: "#FF4D00" }}>{step.n}</div>
                  <div>
                    <p className="text-sm text-gray-600">{step.texte} <strong className="text-gray-900">{step.gras}</strong></p>
                  </div>
                  <span className="ml-auto text-2xl flex-shrink-0">{step.icon}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => router.push("/")} className="text-sm text-gray-400 underline text-center mt-6">
            Continuer sans installer
          </button>
        </div>
      )}

      {/* INSTRUCTIONS IPHONE */}
      {systeme === "iphone" && (
        <div className="flex flex-col max-w-sm mx-auto w-full">
          <button onClick={() => setSysteme("choix")} className="flex items-center gap-1 text-sm text-gray-400 mb-6">
            ← Retour
          </button>

          <p className="text-center font-bold text-gray-900 mb-2">Sur iPhone avec Safari</p>
          <p className="text-center text-xs text-gray-400 mb-6">⚠️ Doit être ouvert dans Safari, pas Chrome</p>

          <div className="flex flex-col gap-3">
            {[
              { n: 1, icon: "🧭", texte: "Ouvre ce lien dans", gras: "Safari" , detail: "Si tu es dans Chrome, copie l'URL et colle-la dans Safari" },
              { n: 2, icon: "⬆️", texte: "Appuie sur l'icône", gras: "Partager ⬆️ en bas de l'écran" , detail: "C'est un carré avec une flèche qui pointe vers le haut" },
              { n: 3, icon: "➕", texte: "Fais défiler et appuie sur", gras: '"Sur l\'écran d\'accueil"', detail: "Tu devras peut-être faire défiler la liste vers le bas" },
              { n: 4, icon: "✅", texte: "Appuie sur", gras: '"Ajouter" en haut à droite', detail: "L'icône SortiesApp apparaîtra sur ton écran d'accueil" },
            ].map(step => (
              <div key={step.n} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white flex-shrink-0 text-xs"
                    style={{ background: "#1a1a1a" }}>{step.n}</div>
                  <p className="text-sm text-gray-600">{step.texte} <strong className="text-gray-900">{step.gras}</strong></p>
                  <span className="ml-auto text-2xl flex-shrink-0">{step.icon}</span>
                </div>
                <p className="text-xs text-gray-400 ml-11">{step.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs text-blue-700 text-center">
              💡 Si tu vois un message "Ajouter à l'écran d'accueil" en bas de Safari, appuie simplement dessus !
            </p>
          </div>

          <button onClick={() => router.push("/")} className="text-sm text-gray-400 underline text-center mt-6">
            Continuer sans installer
          </button>
        </div>
      )}

    </main>
  )
}