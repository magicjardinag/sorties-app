# SortiesApp 🎯

Application d'événements locaux style Fever — pour découvrir et publier des activités près de chez soi.

## 🌐 URLs
- **Site en ligne** : https://sorties-app-seven.vercel.app
- **Repo GitHub** : https://github.com/magicjardinag/sorties-app
- **Admin** : https://sorties-app-seven.vercel.app/admin

## 🛠 Stack technique
- **Frontend** : Next.js 16, React, TypeScript, Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth
- **Paiement** : Stripe (9,90€ par publication)
- **Emails** : Resend
- **Carte** : Google Maps API
- **Déploiement** : Vercel + GitHub (branche master)

## 📁 Fichiers clés
- `app/page.tsx` — Page d'accueil (filtres, géoloc, favoris, pubs)
- `app/evenement/[id]/page.tsx` — Page détail événement
- `app/publier/page.tsx` — Formulaire publication 3 étapes
- `app/admin/page.tsx` — Panneau admin (ADMIN_EMAIL = a.giraudon@astem.fr)
- `app/auth/page.tsx` — Connexion/inscription
- `app/dashboard/page.tsx` — Tableau de bord organisateur
- `app/carte/page.tsx` — Carte Google Maps avec géolocalisation
- `app/contact/page.tsx` — Formulaire contact
- `app/mentions-legales/page.tsx` — Mentions légales
- `app/cgu/page.tsx` — CGU
- `components/Map.tsx` — Composant Google Maps
- `app/api/checkout/route.ts` — Création session Stripe
- `app/api/webhook/route.ts` — Webhook Stripe → Supabase + email
- `app/api/moderation/route.ts` — Approuver/refuser événement
- `app/api/contact/route.ts` — Formulaire contact
- `app/api/rappel/route.ts` — Email de rappel J-1

## 🗄 Base de données Supabase
### Tables
- **evenements** : titre, categorie, ville, quand (date), heure, prix, description, emoji, couleur, organisateur, lat, lng, user_id, statut (en_attente/approuve/refuse), image_url, backup (jsonb), id (uuid)
- **publicites** : id, nom_commerce, description, image_url, lien, ville, actif, lat, lng, rayon
- **favoris** : id, user_id, evenement_id, created_at
- **rappels** : id, email, evenement_id, quand, envoye, created_at

## ✅ Fonctionnalités implémentées
- Page d'accueil avec filtres catégories, recherche, géolocalisation + rayon slider
- Pubs locales rotatives géolocalisées
- Page détail événement : image hero, lightbox affiche, boutons agenda (Google/Apple/Outlook), rappel email J-1, lien GPS
- Carte Google Maps avec marqueurs colorés par catégorie, cercle de rayon, filtres conservés depuis page principale
- Connexion/inscription Supabase Auth, mot de passe oublié
- Formulaire publication 3 étapes : upload affiche → remplissage auto IA (en cours) → paiement Stripe
- Paiement Stripe 9,90€ → webhook → insert Supabase statut en_attente
- Panneau admin : liste événements, vue détail, approuver/refuser/supprimer, modifier avec backup, modération auto par mots-clés, tout approuver, filtre passés
- Emails Resend : notification admin, félicitations/refus organisateur, contact, rappel événement
- Favoris ❤️ par utilisateur connecté
- Formatage dates intelligent (Aujourd'hui, Demain, Lundi...)
- Filtrage événements passés automatique
- Footer avec mentions légales, CGU, contact, partenariat, affiliation

## 🔑 Variables d'environnement
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_URL
RESEND_API_KEY
NEXT_PUBLIC_GOOGLE_MAPS_KEY
OPENAI_API_KEY (analyse affiches - nécessite crédits)
MISTRAL_API_KEY
GEMINI_API_KEY
ANTHROPIC_API_KEY
```

## 🚀 Lancer le projet
```bash
cd C:\Users\Anthony\sorties-app
npm run dev
# Ouvrir http://localhost:3000
```

## 💾 Sauvegardes
```bash
# Créer un backup avant modification
.\backup.ps1

# Lister les backups
git branch

# Restaurer un backup
git checkout backup-2026-03-21-1430
git checkout master
```

## 📋 TODO
- [ ] Analyse IA des affiches (nécessite crédits API OpenAI/Anthropic)
- [ ] Modération automatique IA dans le webhook
- [ ] Billetterie avec places limitées + commission
- [ ] Page favoris dédiée
- [ ] Dashboard analytics
- [ ] SEO + nom de domaine
- [ ] Remplacer infos TEST dans mentions légales/CGU
- [ ] Email de rappel J-1 automatique (cron job)
```