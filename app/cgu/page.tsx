"use client"

import { useRouter } from "next/navigation"

export default function CGU() {
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
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Conditions Générales d'Utilisation</h2>

        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-6">

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">1. Objet</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation du site SortiesApp, plateforme de découverte et de publication d'événements locaux. En utilisant le site, vous acceptez sans réserve les présentes CGU.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">2. Accès au service</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              L'accès au site est gratuit pour les utilisateurs souhaitant consulter les événements. La publication d'un événement est soumise au paiement d'un forfait de <strong>9,90€</strong> par publication. SortiesApp se réserve le droit de refuser ou supprimer tout événement ne respectant pas les présentes CGU.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">3. Obligations des organisateurs</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              En publiant un événement, l'organisateur s'engage à :<br/>
              • Fournir des informations exactes et à jour<br/>
              • Ne pas publier de contenu illégal, trompeur ou offensant<br/>
              • Respecter les droits des tiers (droits d'auteur, image...)<br/>
              • Informer SortiesApp de toute annulation dans les meilleurs délais
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">4. Paiement et remboursement</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Les paiements sont sécurisés via Stripe. En cas de refus de publication par SortiesApp pour non-conformité aux CGU, un remboursement intégral sera effectué sous 5 à 10 jours ouvrés. Aucun remboursement ne sera accordé pour un événement déjà publié et approuvé, sauf en cas d'erreur de notre part.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">5. Modération</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tout événement publié est soumis à validation par l'équipe SortiesApp avant d'être visible publiquement. SortiesApp se réserve le droit de refuser ou supprimer tout événement sans justification si celui-ci ne respecte pas les présentes CGU ou les valeurs de la plateforme.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">6. Responsabilité</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              SortiesApp agit en tant qu'intermédiaire entre les organisateurs et les participants. La plateforme ne peut être tenue responsable des informations erronées fournies par les organisateurs, ni des éventuels dommages liés à la participation à un événement.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">7. Propriété intellectuelle</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              En publiant un événement sur SortiesApp, l'organisateur accorde à SortiesApp une licence non exclusive d'utilisation du contenu publié (textes, descriptions) à des fins de promotion de la plateforme.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">8. Modification des CGU</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              SortiesApp se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification significative par email. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles CGU.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">9. Droit applicable</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </div>

          <p className="text-gray-400 text-xs">Dernière mise à jour : mars 2026</p>
        </div>
      </div>
    </main>
  )
}