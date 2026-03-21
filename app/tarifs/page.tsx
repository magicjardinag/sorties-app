"use client"

import { useRouter } from "next/navigation"

export default function Tarifs() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-600">SortiesApp</h1>
          <p className="text-gray-500 text-sm">Trouve des activités près de chez toi</p>
        </div>
        <button onClick={() => router.push("/")} className="border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">
          ← Retour
        </button>
      </header>

      <section className="bg-purple-600 py-16 px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Nos offres</h2>
        <p className="text-purple-200 text-lg max-w-xl mx-auto">Simple, transparent, adapté à tous — que vous soyez visiteur ou organisateur d'événements.</p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">

        {/* Visiteurs */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Pour les visiteurs</h3>
          <p className="text-gray-500 text-center mb-8">Découvrez des événements près de chez vous</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Gratuit visiteur */}
            <div className="bg-white rounded-2xl shadow p-8 border-2 border-transparent">
              <p className="text-gray-500 text-sm font-medium mb-2">GRATUIT</p>
              <p className="text-4xl font-bold text-gray-800 mb-1">0€</p>
              <p className="text-gray-400 text-sm mb-6">Pour toujours</p>
              <ul className="flex flex-col gap-3 mb-8">
                {["Accès à tous les événements", "Recherche par ville et catégorie", "Carte interactive géolocalisée", "3 rappels email par mois", "Favoris (jusqu'à 10)"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-600 text-sm">
                    <span className="text-green-500 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/auth")} className="w-full border border-purple-300 text-purple-600 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors">
                Commencer gratuitement
              </button>
            </div>

            {/* Premium visiteur */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                POPULAIRE
              </div>
              <p className="text-purple-600 text-sm font-medium mb-2">PREMIUM</p>
              <p className="text-4xl font-bold text-gray-800 mb-1">2,90€</p>
              <p className="text-gray-400 text-sm mb-6">par mois</p>
              <ul className="flex flex-col gap-3 mb-8">
                {[
                  "Tout le plan gratuit",
                  "Rappels email illimités",
                  "Favoris illimités",
                  "Alertes nouveaux événements près de vous",
                  "Pas de publicités",
                  "Accès prioritaire aux nouveautés",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-600 text-sm">
                    <span className="text-purple-500 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/auth")} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
                Essayer 1 mois gratuit
              </button>
            </div>
          </div>
        </div>

        {/* Organisateurs */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Pour les organisateurs</h3>
          <p className="text-gray-500 text-center mb-8">Publiez et faites connaître vos événements</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Gratuit organisateur */}
            <div className="bg-white rounded-2xl shadow p-8 border-2 border-transparent">
              <p className="text-gray-500 text-sm font-medium mb-2">GRATUIT</p>
              <p className="text-4xl font-bold text-gray-800 mb-1">0€</p>
              <p className="text-gray-400 text-sm mb-6">Pour toujours</p>
              <ul className="flex flex-col gap-3 mb-8">
                {[
                  "1 publication par mois",
                  "Visible 7 jours",
                  "Modération sous 24h",
                  "Page événement complète",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-600 text-sm">
                    <span className="text-green-500 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/publier")} className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                Publier gratuitement
              </button>
            </div>

            {/* Pack Visibilité */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                RECOMMANDÉ
              </div>
              <p className="text-purple-600 text-sm font-medium mb-2">PACK VISIBILITÉ</p>
              <p className="text-4xl font-bold text-gray-800 mb-1">9,90€</p>
              <p className="text-gray-400 text-sm mb-6">par mois</p>
              <ul className="flex flex-col gap-3 mb-8">
                {[
                  "Publications illimitées",
                  "Visible 30 jours",
                  "Badge Pro sur vos événements",
                  "Mise en avant dans les résultats",
                  "Statistiques de vues",
                  "Modération prioritaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-600 text-sm">
                    <span className="text-purple-500 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/auth")} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
                Commencer
              </button>
            </div>

            {/* Premium organisateur */}
            <div className="bg-white rounded-2xl shadow p-8 border-2 border-amber-400 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                ⭐ PREMIUM
              </div>
              <p className="text-amber-600 text-sm font-medium mb-2">PREMIUM</p>
              <p className="text-4xl font-bold text-gray-800 mb-1">19,90€</p>
              <p className="text-gray-400 text-sm mb-6">par mois</p>
              <ul className="flex flex-col gap-3 mb-8">
                {[
                  "Tout le Pack Visibilité",
                  "Mise en avant page d'accueil",
                  "Notification aux abonnés de la zone",
                  "Encart publicitaire rotatif",
                  "Support prioritaire",
                  "Rapport mensuel détaillé",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-600 text-sm">
                    <span className="text-amber-500 font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/auth")} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors">
                Contacter pour démarrer
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 bg-white rounded-2xl shadow p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Questions fréquentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: "Puis-je publier gratuitement ?", r: "Oui ! Tout organisateur peut publier 1 événement par mois gratuitement, visible pendant 7 jours." },
              { q: "Comment fonctionne le rappel email ?", r: "Vous recevez un email la veille de l'événement avec toutes les infos et un lien GPS pour y aller." },
              { q: "Puis-je annuler mon abonnement ?", r: "Oui, vous pouvez annuler à tout moment depuis votre espace personnel, sans frais." },
              { q: "Comment être mis en avant ?", r: "Avec le Pack Visibilité ou Premium, vos événements apparaissent en priorité dans les résultats et sur la carte." },
            ].map((item) => (
              <div key={item.q} className="bg-gray-50 rounded-xl p-4">
                <p className="font-bold text-gray-800 mb-2 text-sm">{item.q}</p>
                <p className="text-gray-500 text-sm">{item.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 py-6 px-6 text-center">
        <p className="text-gray-400 text-sm">© 2026 SortiesApp — <button onClick={() => router.push("/contact")} className="hover:text-purple-600">Contact</button> · <button onClick={() => router.push("/mentions-legales")} className="hover:text-purple-600">Mentions légales</button></p>
      </footer>
    </main>
  )
}