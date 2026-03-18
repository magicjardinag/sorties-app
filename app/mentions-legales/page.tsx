"use client"

import { useRouter } from "next/navigation"

export default function MentionsLegales() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-purple-600 hover:text-purple-800 font-medium text-sm">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-purple-600">SortiesApp</h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Mentions légales</h2>

        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-6">

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">1. Éditeur du site</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Le site SortiesApp est édité par :<br/>
              <strong>Raison sociale :</strong> SortiesApp SARL (TEST)<br/>
              <strong>Adresse :</strong> 1 rue de la Paix, 75001 Paris (TEST)<br/>
              <strong>Email :</strong> contact@sortiesapp.fr (TEST)<br/>
              <strong>SIRET :</strong> 000 000 000 00000 (TEST)<br/>
              <strong>Directeur de publication :</strong> Anthony Test
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">2. Hébergement</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Le site est hébergé par :<br/>
              <strong>Vercel Inc.</strong><br/>
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br/>
              Site web : <a href="https://vercel.com" className="text-purple-600 hover:underline">vercel.com</a>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">3. Propriété intellectuelle</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              L'ensemble du contenu présent sur le site SortiesApp (textes, images, logos, icônes) est protégé par le droit d'auteur. Toute reproduction, distribution ou modification sans autorisation préalable est strictement interdite.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">4. Données personnelles (RGPD)</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.<br/><br/>
              Les données collectées (email, nom) sont utilisées uniquement dans le cadre de la gestion de votre compte et de la publication d'événements. Elles ne sont jamais vendues à des tiers.<br/><br/>
              Pour exercer vos droits, contactez-nous à : <strong>contact@sortiesapp.fr (TEST)</strong>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">5. Cookies</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Le site SortiesApp utilise des cookies techniques nécessaires au bon fonctionnement du service (authentification, session). Aucun cookie publicitaire tiers n'est utilisé sans votre consentement.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">6. Responsabilité</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              SortiesApp ne peut être tenu responsable des contenus publiés par les organisateurs d'événements. Tout contenu inapproprié peut être signalé via notre formulaire de contact et sera supprimé dans les plus brefs délais.
            </p>
          </div>

          <p className="text-gray-400 text-xs">Dernière mise à jour : mars 2026</p>
        </div>
      </div>
    </main>
  )
}