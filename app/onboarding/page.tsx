"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const SLIDES = [
  {
    bg: "linear-gradient(160deg, #FF8C42 0%, #FF4D00 100%)",
    emoji: "🎉",
    titre: "Bienvenue sur SortiesApp",
    texte: "Découvre les meilleurs concerts, randonnées, ateliers et événements locaux près de chez toi.",
    accent: "#fff",
  },
  {
    bg: "linear-gradient(160deg, #7C3AED 0%, #9333EA 100%)",
    emoji: "📍",
    titre: "Tout près de chez toi",
    texte: "Filtre par catégorie, date ou distance. Trouve exactement ce que tu cherches en quelques secondes.",
    accent: "#fff",
  },
  {
    bg: "linear-gradient(160deg, #059669 0%, #10B981 100%)",
    emoji: "✨",
    titre: "Gratuit et sans engagement",
    texte: "Browse librement. Inscris-toi seulement quand tu veux participer, ajouter un favori ou publier un événement.",
    accent: "#fff",
  },
]

export default function Onboarding() {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem("onboarding_done")
    if (done) router.replace("/")
  }, [])

  const goTo = (idx: number) => {
    if (idx === SLIDES.length) {
      terminer()
      return
    }
    setVisible(false)
    setTimeout(() => {
      setSlide(idx)
      setVisible(true)
    }, 200)
  }

  const terminer = () => {
    setLeaving(true)
    localStorage.setItem("onboarding_done", "1")
    setTimeout(() => router.replace("/"), 300)
  }

  const s = SLIDES[slide]

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background: s.bg,
        opacity: leaving ? 0 : 1,
        transition: leaving ? "opacity 0.3s ease" : "background 0.6s ease",
      }}
    >
      {/* Zone supérieure — illustration */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 relative overflow-hidden">

        {/* Confettis décoratifs */}
        {[...Array(16)].map((_, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={{
            left: `${(i * 19 + 8) % 100}%`,
            top: `${(i * 27 + 4) % 80}%`,
            width: 6 + (i % 4) * 5,
            height: 6 + (i % 4) * 5,
            background: "rgba(255,255,255,0.2)",
            borderRadius: i % 3 === 0 ? "50%" : "4px",
            transform: `rotate(${i * 42}deg)`,
          }} />
        ))}

        {/* Emoji central */}
        <div
          className="mb-8"
          style={{
            fontSize: 100,
            filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.2))",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1) translateY(0)" : "scale(0.8) translateY(16px)",
            transition: "all 0.25s ease",
          }}
        >
          {s.emoji}
        </div>

        {/* Texte */}
        <div
          className="text-center max-w-xs"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.25s ease 0.05s",
          }}
        >
          <h1 className="font-black text-white text-2xl mb-3 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            {s.titre}
          </h1>
          <p className="text-white/80 text-sm leading-relaxed">
            {s.texte}
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-2 mt-10">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="rounded-full transition-all"
              style={{
                width: i === slide ? 24 : 8,
                height: 8,
                background: i === slide ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Zone inférieure — actions */}
      <div className="px-6 pb-12 pt-6 flex flex-col gap-3 max-w-sm mx-auto w-full">

        {slide < SLIDES.length - 1 ? (
          <>
            <button onClick={() => goTo(slide + 1)}
              className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
              style={{ background: "#fff", color: s.bg.includes("#FF4D00") ? "#FF4D00" : s.bg.includes("#7C3AED") ? "#7C3AED" : "#059669" }}>
              Suivant →
            </button>
            <button onClick={terminer}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-white/70 text-center active:scale-95">
              Passer
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { localStorage.setItem("onboarding_done", "1"); router.push("/auth") }}
              className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
              style={{ background: "#fff", color: "#059669" }}>
              Créer un compte gratuit
            </button>
            <button onClick={terminer}
              className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-white/40 text-white text-center active:scale-95 transition-all">
              Explorer sans s'inscrire →
            </button>
          </>
        )}
      </div>
    </main>
  )
}