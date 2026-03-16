"use client"

import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

const evenements = [
  { id: 1, titre: "Concert Jazz", ville: "Paris", quand: "Ce soir", heure: "20h00", prix: "Gratuit", categorie: "Musique", emoji: "🎵", couleur: "bg-purple-100", organisateur: "Jazz Club Paris", description: "Une soirée jazz exceptionnelle au cœur de Paris. Venez découvrir les meilleurs musiciens de jazz de la scène parisienne dans une ambiance chaleureuse et conviviale. Entrée libre, consommation obligatoire." },
  { id: 2, titre: "Expo Photo", ville: "Lyon", quand: "Demain", heure: "10h00", prix: "5€", categorie: "Culture", emoji: "🎨", couleur: "bg-orange-100", organisateur: "Galerie Lumière", description: "Une exposition photographique unique mettant en valeur les plus beaux clichés de photographes locaux. Une plongée dans l'art visuel contemporain." },
  { id: 3, titre: "Course urbaine", ville: "Bordeaux", quand: "Samedi", heure: "09h00", prix: "10€", categorie: "Sport", emoji: "🏃", couleur: "bg-green-100", organisateur: "Run Bordeaux", description: "Parcourez les plus belles rues de Bordeaux lors de cette course urbaine de 10km. Tous niveaux bienvenus, ambiance festive garantie !" },
  { id: 4, titre: "Marché bio", ville: "Nantes", quand: "Dimanche", heure: "08h00", prix: "Gratuit", categorie: "Food", emoji: "🍕", couleur: "bg-yellow-100", organisateur: "Bio Nantes", description: "Le grand marché bio de Nantes avec plus de 50 producteurs locaux. Fruits, légumes, fromages, pains artisanaux... Venez découvrir les saveurs locales !" },
  { id: 5, titre: "Randonnée forêt", ville: "Grenoble", quand: "Samedi", heure: "07h00", prix: "Gratuit", categorie: "Nature", emoji: "🌿", couleur: "bg-emerald-100", organisateur: "Rando Alpes", description: "Une randonnée guidée de 15km dans les forêts autour de Grenoble. Niveau intermédiaire, prévoir de bonnes chaussures et de l'eau." },
  { id: 6, titre: "Festival Rock", ville: "Paris", quand: "Vendredi", heure: "18h00", prix: "15€", categorie: "Musique", emoji: "🎸", couleur: "bg-purple-100", organisateur: "Rock Paris", description: "Le festival rock incontournable de Paris avec 5 groupes sur scène. Une nuit de musique live dans une salle mythique de la capitale." },
]

export default function EvenementDetail() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const evenement = evenements.find((e) => e.id === id)

  if (!evenement) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-500">Événement introuvable</p>
          <button onClick={() => router.push("/")} className="mt-4 text-purple-600 font-medium">
            ← Retour à l'accueil
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-purple-600 hover:text-purple-800 font-medium text-sm"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp</h1>
      </header>

      {/* Image */}
      <div className={`${evenement.couleur} h-48 flex items-center justify-center text-7xl`}>
        {evenement.emoji}
      </div>

      {/* Contenu */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
          {evenement.categorie}
        </span>

        <h2 className="text-3xl font-bold text-gray-800 mt-3 mb-2">
          {evenement.titre}
        </h2>

        <p className="text-gray-500 mb-6">{evenement.ville} • {evenement.quand}</p>

        {/* Infos */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Date</p>
            <p className="font-medium text-gray-800">{evenement.quand}, {evenement.heure}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Lieu</p>
            <p className="font-medium text-gray-800">{evenement.ville}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Prix</p>
            <p className={`font-medium ${evenement.prix === "Gratuit" ? "text-green-600" : "text-gray-800"}`}>
              {evenement.prix}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Organisateur</p>
            <p className="font-medium text-gray-800">{evenement.organisateur}</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-2">À propos</h3>
          <p className="text-gray-600 leading-relaxed">{evenement.description}</p>
        </div>

        {/* Bouton */}
        <button className="w-full bg-purple-600 text-white py-4 rounded-full text-lg font-bold hover:bg-purple-700 transition-colors">
          Je participe !
        </button>
      </div>
    </main>
  )
}